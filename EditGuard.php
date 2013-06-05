<?php

if( !defined( 'MEDIAWIKI' ) ) {
	echo( "EditGuard is an extension to the MediaWiki software and cannot be used standalone.\n" );
	die( 1 );
}

define( "EG_VERSION", "1.2, 2011/08" );

$wgExtensionCredits['parserhook'][] = array (
   'name' => 'EditGuard',
   'author' =>'[http://www.gcpedia.gc.ca/wiki/User:Matthew.april Matthew April]',
   'description' => 'Checks if a user has been logged out before saving the page',
   'version' => EG_VERSION
);

$dir = dirname(__FILE__);

# AJAX
require_once("$dir/EditGuard.ajax.php");
$wgAjaxExportList[] = 'getCurrentToken';
$wgAjaxExportList[] = 'checkSessionState';

$wgAutoloadClasses['EditGuard'] =  $dir . '/EditGuard.body.php';
$wgExtensionMessagesFiles['EditGuard'] = $dir . '/EditGuard.i18n.php';
$editGuard = new EditGuard();

# hooks
$wgHooks['EditPage::showEditForm:initial'][] =  array( $editGuard, 'efEditGuard' );
$wgHooks['EditPage::showEditForm:fields'][] = array( $editGuard, 'addHiddenField' );
