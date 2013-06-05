<?php

/**
 * Class for EditGuard Extension
 *
 * @addtogroup Extensions
 * @author Matthew April <Matthew.April@tbs-sct.gc.ca>
 */
class EditGuard {
	
	/**
	 * Loads HTML and JavaScript into the edit page.
	 * 
	 * @param $editPage current EditPage object
	 * @return true on success, false on abort
	 * 
	 * @author Matthew April <Matthew.JApril@gmail.com>
	 */
	function efEditGuard( $editPage ) {
		global $wgOut, $wgUser, $wgScriptPath, $EditGuardAjaxFile, $wgServer, $wgSitename;
		
		# do not load for anons
		if( $wgUser->isAnon() ) {
			return false;
		}
		
		# do not load if user has 'rememberpassword' enabled
		## avoids unnecessarily loading this extension
		$rememberPass = $wgUser->getOption('rememberpassword');
		if( $rememberPass === "1" ) {
			return false;
		}
		
		# javascript vars
		$js = "";
		$userId = $wgUser->getId();
		$userName = $wgUser->getName();
		$ajaxFile = $wgServer . $wgScriptPath . "/extensions/" . $EditGuardAjaxFile; //url
		$API = $wgServer . $wgScriptPath . "/api.php"; //url
		# messages
		$defaultMsg = wfMsgExt( 'eg-login-error', array( 'parseinline', 'escape') );
		$goodloginMsg = wfMsg( 'eg-success' );
		$nonameMsg = wfMsgExt( 'noname', array( 'parseinline', 'escape') );
		$emptypassMsg = wfMsg( 'wrongpasswordempty' );
		$wrongpassMsg = wfMsgExt( 'wrongpassword', array( 'parseinline', 'escape') );
		$throttledMsg = wfMsgExt( 'login-throttled', array( 'parseinline', 'escape') );
		$blockedMsg = wfMsgExt( 'login-userblocked', array( 'parsemag', 'escape' ), $userName );
		
		
		# strip line breaks to avoid JS errors...
		$emptypassMsg = str_replace(array("\n", "\r"), ' ', $emptypassMsg);
		$wrongpassMsg = str_replace(array("\n", "\r"), ' ', $wrongpassMsg);
		$throttledMsg = str_replace(array("\n", "\r"), ' ', $throttledMsg);
		
		# preload js vars
		$js .= "<script type='text/javascript'>
var userId = $userId;
var userName = \"$userName\";
var ajaxFile = \"$ajaxFile\";
var API = \"$API\";
var defaultMsg = \"$defaultMsg\";
var goodloginMsg = \"$goodloginMsg\";
var nonameMsg = \"$nonameMsg\";
var emptypassMsg = \"$emptypassMsg\";
var wrongpassMsg = \"$wrongpassMsg\";
var throttledMsg = \"$throttledMsg\";
var blockedMsg = \"$blockedMsg\";
var editAttributes = [ 'id', 'name', 'tabindex', 'value', 'accesskey', 'title' ];
</script>";
		
		# embed scripts
		$wgOut->addScript( $js );
		$wgOut->addScriptFile( "$wgScriptPath/extensions/EditGuard/json/json2.js" ); # json libraries
		$wgOut->addScriptFile( "$wgScriptPath/extensions/EditGuard/json/json_parse.js" ); # json libraries
		$wgOut->addScriptFile( "$wgScriptPath/extensions/EditGuard/editguard.js" );
		
		
		# HTML & CSS
		$stylePath = "$wgScriptPath/extensions/EditGuard/editguard.css";
		$out = "";
		
		$out .= "<div id='EGBlanket' style='display:none;'></div>";
		$out .= "<div id='EGWarning' style='display:none;'>";
		
		$out .=		"<h2 id='loggedout'>" . wfMsg('eg-loggedout-title') . "</h2>";
		
		$out .= 	wfMsg( 'eg-timeout', $wgSitename ) . "<br /><br />";
		
		$out .=		"<div id='EGLogin' class='EGcenter'>";
		
		$out .=		"<div class='EGinline'>";
		$out .=			wfMsg('yourname') . "<br />";
		$out .= 		Html::input( 'wpName', $userName, 'text', array(
							'id' => 'wpName1',
							'disabled' => 'DISABLED'
							)
						);
		$out .=		"</div>";
		
		$out .=		"<div class='EGinline'>";
		$out .=			wfMsg('yourpassword') . "<br />";
		$out .=			Html::input( 'wpPassword', '', 'password', array(
							'id' => 'wpPassword'
							)
							
						);
		$out .=		"</div>";
		$out .=		"<div class='EGclear'> </div>";
						
		$out .=			Html::rawElement( 'button', array(
							'type' => 'button',
							'onclick' => 'doLogin()'
							
							), wfMsg('login')
						);
		
		$out .=		"</div>";
		
		$out .=		"<div id='loginSuccess' class='success EGcenter'></div>
					 <div id='loginError' class='error EGcenter'></div>";
		
		$out .= "<br />";
		
		$out .= Html::rawElement( 'button', array(
					'type' => 'button',
					'onclick' => 'continueSubmit()'
					
					), wfMsg('eg-continue')
				);
		$out .= Html::rawElement( 'button', array(
					'type' => 'button',
					'onclick' => 'cancelSubmit()'
					
					), wfMsg('eg-cancel')
				);
				
		global $wgEmergencyContact;
		if( isset($wgEmergencyContact) ) {
			$helpContact = wfMsgWikiHtml( 'eg-helpcontact', $wgEmergencyContact );
			$out .=	"<span id='EGContact'>$helpContact</span>";
		}
		$out .= "</div>";
		
		
		$wgOut->addStyle( $stylePath );
		$editPage->editFormTextTop .= $out;
		
		return true;
	
	}
	
	/**
	 * Injects a hidden field into the edit page
	 *
	 * Injects a hidden form field which we will modify using
	 * JS so that the EditPage knows which button was clicked
	 * when we submit the form (a bit hacky but it does the job)
	 * 
	 * @param $editpage EditPage object
	 * @param $output OutputPage object
	 * 
	 * @return true on completion
	 * 
	 * @author Matthew April <Matthew.JApril@gmail.com>
	 */
	function addHiddenField( &$editpage, &$output ) {
		
		$output->addHTML(	Html::input( 'egHidden', '', 'hidden', array(
								'id' => 'egHidden'
								)
							)
						);
		
		return true;
	}
	
}