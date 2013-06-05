<?php
/**
 * AJAX function repository for EditGuard
 * 
 * @author Matthew April <Matthew.JApril@gmail.com>
 */

function checkSessionState( $userId ) {
	global $wgUser;
	
	if( $wgUser->isLoggedIn() ) {
		# logged in
		echo "SESSION_ACTIVE";
	} else {
		if( isset( $_SESSION['wsEditToken'] ) ) {
			# logged out, session data exists
			echo "SESSION_INACTIVE";
		} else {
			# logged out, session data missing
			echo "SESSION_MISSING";
		}
	}
	
	return "";
}

function getCurrentToken( $user ) {
	global $wgUser;
	
	$currentUser = $wgUser->getName();
	
	# make sure the request is coming from the right user
	if( strcmp( $user, $currentUser ) === 0 ) {
		echo $wgUser->editToken();
	}
		
	return "";
}