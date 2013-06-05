/*
 * EditGuard
 *
 * @author Matthew April <Matthew.JApril@gmail.com>
 */

/**
 * calls out setup function on page load
 *
 * properly handles the window.onload event
 *
 * @param func String callback function name
 * @return boolean true on completion.
 */
function addLoadEvent( func ) {
  var oldonload = window.onload;
  if (typeof window.onload !== 'function') {
    window.onload = func;
  } else {
    window.onload = function() {
      if (oldonload) {
        oldonload();
      }
      func();
    };
  }
  return true;
}
addLoadEvent(loadEditGuard);

/**
 * loads extension event handlers into the edit buttons
 *
 */
function loadEditGuard() {
	var saveBtn = document.getElementById("wpSave");
	var buttonWrapper = saveBtn.parentNode;
	var inputNodes = buttonWrapper.getElementsByTagName("input");
	
	// loop through form buttons and add event handlers
	for( var i = 0; i < inputNodes.length; i++) {
		var newNode = modifyNode( inputNodes[i] );
		
		if( newNode !== false ) {
			buttonWrapper.replaceChild( newNode, inputNodes[i] );
		}
	}
}

/**
 * replaces the given input button with a new button
 *
 * changes the input type from 'submit' to 'button' and
 * adds an 'onclick' event
 *
 * @param oldNode Object input element
 * @return mixed new HTML input object on success, false on failure
 */
function modifyNode( oldNode ) {
	
	// create new element
	var newNode = document.createElement('input');
	newNode.setAttribute("type", "button");
	
	// copy all old attributes to new element, except for 'type'
	for( var i=0; i < editAttributes.length; i++ ) {
		newNode.setAttribute( editAttributes[i], oldNode.getAttribute(editAttributes[i]) );
	}
	
	// add event listener
	if( window.attachEvent ) {
		newNode.attachEvent( "onclick", function(){ handleSessionState( oldNode.name ); } );
	} else if( window.addEventListener ) {
		newNode.addEventListener("click", function(){ handleSessionState( oldNode.name ); }, true);
	} else {
		return false;
	}
	
	return newNode;
}

/**
 * handles the form submission
 *
 * if the users session is lost the confirm box is displayed, 
 * otherwise the form will be submitted
 *
 * @param action String name of the edit button that was clicked
 * @return Boolean true on completion
 */
function handleSessionState( action ) {

	// set hidden field
	document.getElementById('egHidden').name = action;
	
	var xmlHttp = createXmlHttp();
	if( xmlHttp !== null ) {
		
		var ajaxFuncName = "checkSessionState";
		var ajaxFuncParm = userId;
		
		uri = wgServer +
			((wgScript == null) ? (wgScriptPath + "/index.php") : wgScript) +
			"?action=ajax";
		uri = uri + "&rs=" + ajaxFuncName + "&rsargs[]=" + ajaxFuncParm;
		
		xmlHttp.open( "GET", uri, false );
		xmlHttp.send();
		
		var sessionState = xmlHttp.responseText;
		switch( sessionState ) {
			case "SESSION_ACTIVE":
				continueSubmit();
				break;
			
			case "SESSION_INACTIVE":
				showConfirmDiv( true );
				break;
				
			case "SESSION_MISSING":
				showConfirmDiv( true );
				break;
			
			default:
				// unexpected response - continue form submission
				continueSubmit();
				break;
		}
		
	} else {
		continueSubmit();
	}
	
	return true;
}

/**
 * Creates an XMLHTTP Object
 *
 * @return mixed XMLHTTP object on success, null if unavailable
 */
function createXmlHttp() {
	var xmlHttp = null;
	
	if(window.XMLHttpRequest) {
		// IE7+, Firefox, Chrome, Opera, Safari
		xmlHttp = new XMLHttpRequest();
		
	} else if( window.ActiveXObject ) {
		// IE6, IE5
		xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	return xmlHttp;
}

/**
 * handles login attempt
 *
 * @return bool true on completion
 */
function doLogin() {

	setSuccessMsg("");
	setErrorMsg("");
	var userPass = document.getElementById('wpPassword').value;
	// first request to get token
	// TODO: Make this compatible with pre 1.15
	var initResponse = APILoginRequest( userName, '', '', '' );
	
	if( initResponse !== false ) {
	
		var valuesObj = parseLoginValues( initResponse, ["token", "session"] );
		var token = valuesObj.token;
		var id = valuesObj.session;
		
		// real login attempt
		loginResponse = APILoginRequest( userName, userPass, token, id );
		var loginObj = parseLoginValues( loginResponse, ["result"] );
		var result = loginObj.result;
		
		handleLoginResponse( result );
	} else {
		setErrorMsg( defaultMsg );
	}
	
	return true;
	
}

/**
 * AJAX login request via the API
 * 
 * @param uname string username
 * @param key string user password
 * @param token string login token
 * @param id string session id
 * @return mixed response string on request completion, false on failure to connect
 */
function APILoginRequest( uname, key, token, id ) {
	var response = false;
	var xmlHttp = createXmlHttp();
	
	if( xmlHttp !== null ) {
		xmlHttp.open( "POST", API + "?action=login&format=json", false );
		xmlHttp.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
		xmlHttp.send( "lgname=" + uname + "&lgpassword=" + key + "&lgtoken=" + token + "&sessionid=" + id );
		response = xmlHttp.responseText;
	}
	
	return response;
}

/**
 * handles the login attempt response string
 *
 * @param result String response text from API login
 * @return Boolean true on completion
 */
function handleLoginResponse( result ) {
	
	switch( result ) {
	
		case "Success":
			setSuccessMsg( goodloginMsg );
			document.getElementById('wpPassword').value = '';
			updateToken();
			break;
		case "NoName":
			setErrorMsg( nonameMsg );
			break;
		case "EmptyPass":
			setErrorMsg( emptypassMsg );
			break;
		case "WrongPass":
			setErrorMsg( wrongpassMsg );
			break;
		case "WrongPluginPass":
			setErrorMsg( wrongpassMsg );
			break;
		case "CreateBlocked":
			setErrorMsg( blockedMsg );
			break;
		case "Throttled":
			setErrorMsg( throttledMsg );
			break;
		case "Blocked":
			setErrorMsg( blockedMsg );
			break;
		default:
			// generic error incase something went wrong
			setErrorMsg( defaultMsg );
			break;
	}
	
	return true;
}

/**
 * parses the JSON object returned from an API login attempt
 *
 * @param Object JSON Object
 * @param keys Array keys to be parsed and returned
 * @return Object Object containing the values of the requested keys
 */
function parseLoginValues( object, keys  ) {
	
	var mObject = JSON.parse( object );
	var values = new Object();
	
	if( mObject.login ) {
		for( var i=0; i < keys.length; i++ ) {
			values[keys[i]] = mObject.login[keys[i]];
		}
	}
	
	return values;
	
}

/**
 * Updates the edit token inside the form
 *
 * replaces the users old edit token with their current one
 * this is useful when a session is deleted and re-created
 *
 * @return Boolean true on completion
 */
function updateToken() {
	var token = document.editform.elements.wpEditToken.value;
	sajax_do_call( 'getCurrentToken',
					[userName],
					function( xmlHttp ) {
						var newToken = xmlHttp.responseText;
						//reduce the risk of changing to an invalid token by comparing length
						if( newToken.length === token.length ) {
							document.editform.elements.wpEditToken.value = newToken;
						}
					}
	);
	
	return true;
}

/**
 * submits the form and hides the confirm window
 *
 * @return Boolean true on completion
 */
function continueSubmit() {
	showConfirmDiv( false );
	document.getElementById("editform").submit();
	return true;
}

/**
 * closes the confirm window and clears text fields
 *
 * @return Boolean true on completion
 */
function cancelSubmit() {
	showConfirmDiv( false );
	setSuccessMsg('');
	setErrorMsg('');
	document.getElementById('wpPassword').value = '';
	return true;
}

/**
 * sets the error message under the login form
 *
 * @return Boolean true on completion
 */
function setErrorMsg( msg ) {
	var errorDiv = document.getElementById('loginError');
	errorDiv.innerHTML = msg;
	return true;
}

/**
 * sets the success message under the login form
 *
 * @return Boolean true on completion
 */
function setSuccessMsg( msg ) {
	var successDiv = document.getElementById('loginSuccess');
	successDiv.innerHTML = msg;
	return true;
}

/**
 * show/hide the popup window
 *
 */
function showConfirmDiv( enabled ) {
	if( enabled ) {
		document.getElementById("EGBlanket").style.display = "block";
		document.getElementById("EGWarning").style.display = "block";
		//jump to location (important when CSS is disabled or using IE6)
		document.getElementById("wpPassword").focus();
		window.location.hash = "loggedout";
		
	} else {
		document.getElementById("EGBlanket").style.display = "none";
		document.getElementById("EGWarning").style.display = "none";
	}
	
}