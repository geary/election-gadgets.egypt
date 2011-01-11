// Copyright 2008-2010 Michael Geary
// http://mg.to/
// Free Beer and Free Speech License (any OSI license)
// http://freebeerfreespeech.org/

//window.console && typeof console.log == 'function' && console.log( location.href );

(function() {

var key = 'ABQIAAAAL7MXzZBubnPtVtBszDCxeRTZqGWfQErE9pT-IucjscazSdFnjBSzjqfxm1CQj7RDgG-OoyNfebJK0w';

function getWH( what ) {
	return window[ 'inner' + what ] || document.documentElement[ 'offset' + what ];
}

function winWidth() { return getWH('Width'); }
function winHeight() { return getWH('Height'); }

$.fn.visibleHeight = function() {
	return this.is(':visible') ? this.height() : 0;
};

$.fn.visibleWidth = function() {
	return this.is(':visible') ? this.width() : 0;
};

var gem = GoogleElectionMap = {};

// Utility functions and jQuery extensions

// temp?
opt.nocache = opt.debug;

var mapplet = opt.mapplet;
if( mapplet ) {
	opt.codeUrl = opt.baseUrl;
	opt.dataUrl = opt.dataUrl || opt.baseUrl;
}
else {
	opt.dataUrl = opt.codeUrl;
	if( opt.debug ) opt.dataUrl += 'proxy-local.php?jsonp=?&file=';
}

var $window = $(window), $body = $('body');

function writeScript( url ) {
	document.write( '<script type="text/javascript" src="', url, '"></script>' );
}

writeScript( 'http://www.google.com/jsapi?key=' + key );

if( ! Array.prototype.forEach ) {
	Array.prototype.forEach = function( fun /*, thisp*/ ) {
		if( typeof fun != 'function' )
			throw new TypeError();
		
		var thisp = arguments[1];
		for( var i = 0, n = this.length;  i < n;  ++i ) {
			if( i in this )
				fun.call( thisp, this[i], i, this );
		}
	};
}

if( ! Array.prototype.map ) {
	Array.prototype.map = function( fun /*, thisp*/ ) {
		var len = this.length;
		if( typeof fun != 'function' )
			throw new TypeError();
		
		var res = new Array( len );
		var thisp = arguments[1];
		for( var i = 0;  i < len;  ++i ) {
			if( i in this )
				res[i] = fun.call( thisp, this[i], i, this );
		}
		
		return res;
	};
}

Array.prototype.mapjoin = function( fun, delim ) {
	return this.map( fun ).join( delim || '' );
};

Array.prototype.random = function() {
	return this[ randomInt(this.length) ];
};

Array.prototype.randomized = function() {
	var from = this.concat();
	var to = [];
	while( from.length )
		to.push( from.splice( randomInt(from.length), 1 )[0] );
	return to;
};

function sortArrayBy( array, key, opt ) {
	opt = opt || {};
	// TODO: use code generation instead of multiple if statements?
	var sep = unescape('%uFFFF');
	
	var i = 0, n = array.length, sorted = new Array( n );
	if( opt.numeric ) {
		if( typeof key == 'function' ) {
			for( ;  i < n;  ++i )
				sorted[i] = [ ( 1000000000000000 + key(array[i]) + '' ).slice(-15), i ].join(sep);
		}
		else {
			for( ;  i < n;  ++i )
				sorted[i] = [ ( 1000000000000000 + array[i][key] + '' ).slice(-15), i ].join(sep);
		}
	}
	else {
		if( typeof key == 'function' ) {
			for( ;  i < n;  ++i )
				sorted[i] = [ key(array[i]), i ].join(sep);
		}
		else if( opt.caseDependent ) {
			for( ;  i < n;  ++i )
				sorted[i] = [ array[i][key], i ].join(sep);
		}
		else {
			for( ;  i < n;  ++i )
				sorted[i] = [ array[i][key].toLowerCase(), i ].join(sep);
		}
	}
	
	sorted.sort();
	
	var output = new Array( n );
	for( i = 0;  i < n;  ++i )
		output[i] = array[ sorted[i].split(sep)[1] ];
	
	return output;
}

function randomInt( n ) {
	return Math.floor( Math.random() * n );
}

function S() {
	return Array.prototype.join.call( arguments, '' );
}

function linkIf( text, href, title ) {
	title = htmlEscape( title || text ).replace( /"/g, '&quot;' );
	text = htmlEscape( text );
	return ! href ? text : S(
		'<a target="_blank" href="', href, '" title="', title, '">',
			text,
		'</a>'
	);
}

function fetch( url, callback, cache ) {
	if( cache === false ) {
		$.getJSON( url, callback );
	}
	else if( opt.debug  &&  url.indexOf(opt.dataUrl) == 0 ) {
		$.getJSON( url, function( data ) {
			if( ! data ) data = { error: 'Null data' };
			if( data.error ) alert( data.error + ':\n' + url );
			else callback( data.result );
		});
	}
	else {
		_IG_FetchContent( url, callback, {
			refreshInterval: cache != null ? cache : opt.nocache ? 1 : opt.cache || 600
		});
	}
}

T = function( name, values, give ) {
	name = name.split(':');
	var file = name[1] ? name[0] : T.file;
	var url = T.baseUrl + file + '.html', part = name[1] || name[0];
	if( T.urls[url] )
		return ready();
	
	fetch( url, function( data ) {
		var o = T.urls[url] = {};
		var a = data
			.replace( /\r/g, '' )
			.replace( /([^ ])\n+\s*/g, '$1' )
			.split( /\s*<!--::\s+/g );
		for( var i = 1, n = a.length;  i < n;  ++i ) {
			var s = a[i], k = s.match(/^\S+/), v = s.replace( /^\S+\s+::-->/, '' );
			o[k] = $.trim(v);
		}
		ready();
	}, 60 );
	
	function ready() {
		var text = T.urls[url][part];
		if( ! text ) return T.error && T.error( url, part );
		text = text.replace(
			/(<!--)?\{\{(\w+)\}\}(-->)?/g,
			function( match, ignore, name ) {
				//window.console && console.log( name );
				var value = values && values[name];
				if( value == null ) value = T.variables && T.variables[name];
				if( value == null ) value = match;
				return value;
			});
		give && give(text);
		return text;
	}
	
	return null;
};
T.urls = {};

T.baseUrl = opt.dataUrl;
T.file = 'voter-info-templates';
T.error = function( url, part ) {
	if( part == 'ignore' ) {
		$('#outerlimits').html( S(
			'<div>',
				'Sorry, we are having trouble loading the Google Election Center app.<br>',
				'Please try again later.',
			'</div>'
		) );
	}
	else {
		alert(S( "T('", part, "') missing from ", url ));
	}
};

$.T = function( name, values /* TODO: , give */ ) {
	return $( T( name, values ) );
};

function htmlEscape( str ) {
	var div = document.createElement( 'div' );
	div.appendChild( document.createTextNode( str ) );
	return div.innerHTML;
}

function adjustHeight() {
	if( mapplet ) _IG_AdjustIFrameHeight();
}

function cacheUrl( url, cache, always ) {
	if( opt.nocache  &&  ! always ) return url + '?q=' + new Date().getTime();
	//if( opt.nocache ) cache = 0;
	//if( typeof cache != 'number' ) cache = 3600;
	//url = _IG_GetCachedUrl( url, { refreshInterval:cache } );
	//if( ! url.match(/^http:/) ) url = 'http://' + location.host + url;
	return url;
}

function imgUrl( url, cache, always ) {
	return cacheUrl( opt.codeUrl + 'images/' + url, cache, always );
}

function url( base, params, delim ) {
	var a = [];
	for( var p in params ) {
		var v = params[p];
		if( v != null ) a[a.length] = [ p, v ].join('=');
	}
	return a.length ? [ base, a.sort().join('&') ].join( delim || '?' ) : base;
}

function linkto( addr ) {
	var a = htmlEscape( addr ), u = a;
	if( addr.match(/@/) )
		u = 'mailto:' + u;
	else if( ! addr.match(/^http:\/\//) )
		u = a = 'http://' + a;
	return S( '<a target="_blank" href="', u, '">', a, '</a>' );
}

function minimarkdown( text ) {
	return text
		.replace( /\*([^*]+)\*/g, '<b>$1</b>' )
		.replace( /_([^_]+)_/g, '<i>$1</i>' );
}

$.extend( $.fn, {
	
	setClass: function( cls, add ) {
		return this[ add ? 'addClass' : 'removeClass' ]( cls );
	},
	
	toggleSlide: function( speed, callback ) {
		return this[ this.is(':hidden') ? 'slideDown' : 'slideUp' ]( speed, callback );
	}
	
});

function analytics( path ) {
	function fixHttp( url ) {
		return url.replace( /http:\/\//, 'http/' ).replace( /mailto:/, 'mailto/' );
	}
	function fixAction( url ) {
		return {
			'lookup': 'search_submit',
			'#detailsbox': 'view_detail',
			'#mapbox':  'load_map',
			'#Poll411Gadget': 'find_location'
		}[url];
	}
	if( window._ADS_ReportInteraction ) {
		if( path == 'view'  ||  /^javascript:/.test(path) ) return;
		var action = fixAction( path );
		if( action ) {
			//console.log( 'adaction', action );
			_ADS_ReportInteraction( action );
		}
		else {
			//console.log( 'adclick', path );
			_ADS_ReportInteraction( 'destination_url_1', path );
		}
	}
	else {
		if( path.indexOf( 'http://maps.gmodules.com/ig/ifr' ) == 0 ) return;
		if( path.indexOf( 'http://maps.google.com/maps?f=d' ) == 0 ) path = '/directions';
		path = ( maker ? '/creator/' : pref.onebox ? '/onebox/' : mapplet ? '/mapplet/' : inline ? '/inline/' : '/gadget/' ) + fixHttp(path);
		path = '/' + fixHttp(document.referrer) + '/' + path;
		//console.log( 'analytics', path );
		_IG_Analytics( 'UA-5730550-1', path );
	}
}

// GAsync v2 by Michael Geary
// Commented version and description at:
// http://mg.to/2007/06/22/write-the-same-code-for-google-mapplets-and-maps-api
// Free beer and free speech license. Enjoy!

function GAsync( obj ) {
	
	function callback() {
		args[nArgs].apply( null, results );
	}
	
	function queue( iResult, name, next ) {
		
		function ready( value ) {
			results[iResult] = value;
			if( ! --nCalls )
				callback();
		}
		
		var a = [];
		if( next.join )
			a = a.concat(next), ++iArg;
		if( mapplet ) {
			a.push( ready );
			obj[ name+'Async' ].apply( obj, a );
		}
		else {
			results[iResult] = obj[name].apply( obj, a );
		}
	}
	
	//var mapplet = ! window.GBrowserIsCompatible;
	
	var args = arguments, nArgs = args.length - 1;
	var results = [], nCalls = 0;
	
	for( var iArg = 1;  iArg < nArgs;  ++iArg ) {
		var name = args[iArg];
		if( typeof name == 'object' )
			obj = name;
		else
			queue( nCalls++, name, args[iArg+1] );
	}
	
	if( ! mapplet )
		callback();
}

var userAgent = navigator.userAgent.toLowerCase(),
	msie = /msie/.test( userAgent ) && !/opera/.test( userAgent );

var example = ( mapplet ? '' : 'Ex: ' ) + '1600 Pennsylvania Ave, Washington DC';

var prefs = new _IG_Prefs();
var pref = {
	gadgetType: 'iframe',
	details: 'tab',
	example: example,
	address: '',
	fontFamily: 'Arial,sans-serif',
	fontSize: '16',
	fontUnits: 'px',
	logo: false,
	onebox: false,
	state: '',
	homePrompt: 'Get your voter info! Enter the *full home address* where you&#8217;re registered to vote, including city and state:',
	electionId: '',
	sidebar: false
};
for( var name in pref ) pref[name] = prefs.getString(name) || pref[name];
pref.ready = prefs.getBool('submit');

// Override prompt
//pref.homePrompt = 'We are not supporting any current elections. Click the *Search* button for a demo of this app:';

if( pref.logo ) pref.example = pref.example.replace( 'Ex:', 'Example:' );

if( pref.logo || mapplet ) {
	pref.fontSize = '13';
}

if( pref.example in {
	'Enter your home address':1  // onebox sends us this on a no-entry click
}) {
	pref.example = example;
	pref.ready = false;
}

var maker = decodeURIComponent(location.href).indexOf('source=http://www.gmodules.com/ig/creator?') > -1;

var fontStyle = S( 'font-family:', escape(pref.fontFamily), '; font-size:', pref.fontSize, pref.fontUnits, '; ' );

T.variables = {
	width: winWidth() - 8,
	height: winHeight() - 80,
	heightFull: winHeight(),
	homePrompt: minimarkdown(pref.homePrompt),
	example: pref.example,
	fontFamily: pref.fontFamily.replace( "'", '"' ),
	fontSize: pref.fontSize,
	fontUnits: pref.fontUnits,
	fontStyle: fontStyle,
	gadget: opt.gadgetUrl,
	logoImage: imgUrl('election_center_logo.gif'),
	spinDisplay: pref.ready ? '' : 'display:none;',
	spinImage: imgUrl('spinner.gif')
};

// Date and time

var seconds = 1000, minutes = 60 * seconds, hours = 60 * minutes,
	days = 24 * hours, weeks = 7 * days;

var dayNames = [
	'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

var monthNames = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDate( date ) {
	date = new Date( date );
	return S(
		monthNames[ date.getMonth() ], ' ',
		date.getDate()
	);
}

function formatDayDate( date ) {
	return S(
		dayNames[ new Date(date).getDay() ], ', ',
		formatDate( date )
	);
}

function dateFromMDY( mdy ) {
	mdy = mdy.split('/');
	return new Date( mdy[2], mdy[0]-1, mdy[1] );
}
	
var today = new Date;
today.setHours( 0, 0, 0, 0 );

////  Date tester
//if( 0 ) {
//	today = new Date( 2008,  9, 6 );
//	document.write(
//		'<div style="font-weight:bold;">',
//			'Test date: ', formatDayDate( today ),
//		'</div>'
//	);
//}
////

// State data

var stateUS = {
	abbr: 'US',
	name: 'United States',
	gsx$north: { $t: '49.3836' },
	gsx$south: { $t: '24.5457' },
	gsx$east: { $t: '-66.9522' },
	gsx$west: { $t: '-124.7284' }
};

var states = [];
var statesByAbbr = {};
var statesByName = {};

function stateByAbbr( abbr ) {
	if( typeof abbr != 'string' ) return abbr;
	return statesByAbbr[abbr.toUpperCase()] || stateUS;
}

function indexSpecialStates() {
	var special = {
		'N Carolina': 'North Carolina',
		'N Dakota': 'North Dakota',
		'S Carolina': 'South Carolina',
		'S Dakota': 'South Dakota',
		'W Virginia': 'West Virginia'
	};
	for( var abbr in special )
		statesByName[abbr] = statesByName[ special[abbr] ];
}

var inline = ! mapplet  &&  pref.gadgetType == 'inline';
var iframe = ! mapplet  &&  ! inline;
var balloon = pref.sidebar  ||  mapplet  ||  ( winWidth() >= 450  &&  winHeight() >= 400 );
var sidebar = !!( pref.sidebar  ||  ( ! mapplet  &&  winWidth() >= 800  &&  winHeight() >= 500 ) );

$body.toggleClass( 'logo', pref.logo );
$body.toggleClass( 'sidebar', sidebar );

function initialMap() {
	return balloon && vote && vote.info && vote.info.latlng;
}

var map;
var home, vote, interpolated;

// HTML snippets

function electionHeader() {
	//var abbr = vote.info && vote.info.state && vote.info.state.abbr;
	// temp hack - get election name from API instead
	var name =
		pref.electionId == 1788 ? 'Mississippi Special Election' :
		'';
	return S(
		'<div style="font-weight:bold;">',
			name,
		'</div>'
	);
}

function includeMap() {
	return vote && vote.info && vote.info.latlng;
}

function tabLinks( active ) {
	function tab( id, label ) {
		return T( id == active ? 'tabLinkActive' : 'tabLinkInactive', {
			id: id,
			label: label
		});
	}
	return T( 'tabLinks', {
		tab1: tab( '#detailsbox', 'Details' ),
		tab2: includeMap() ? tab( '#mapbox', 'Map' ) : '',
		tab3: pref.ready ? '' : tab( '#Poll411Gadget', 'Search' )
	});
}

function infoLinks() {
	return home && home.info ? T('infoLinks') : '';
}

function attribution() {
	var special = {
		VA: T('attributionVA')
	}[ home && home.info && home.info.state && home.info.state.abbr ] || '';
	if( special ) special += ' and the ';

	return T( 'attribution', { special: special });
}

// Maker inline initialization

function makerWrite() {
	if( msie ) $('body')[0].scroll = 'no';
	$('body').css({ margin:0, padding:0 });
	
	document.write(
		'<div id="outerlimits">',
		'</div>'
	);
}

// Gadget inline initialization

function gadgetWrite() {
	
	//backLink = params.cnn || params.state ? S(
	//	'<div style="margin:0.5em 0 0 6px; ', fontStyle, '">',
	//		'<a target="_blank" alt="Return to CNN&#146;s Election Center 2008" href="http://www.cnn.com/ELECTION/2008/">',
	//			'Return to CNN&#146;s Election Center 2008',
	//		'</a>',
	//	'</div>'
	//) : '';
	
	document.write(
		'<div id="outerlimits">',
		'</div>'
	);
	
	if( ! mapplet ) {
		document.body.scroll = 'no';
	}
}

// Document ready code

function makerReady() {
	analytics( 'creator' );
	
	var $outerlimits = $('#outerlimits');
	
	function center( $item ) {
		$item.css({
			left: ( winWidth() - $item.width() ) / 2,
			top: ( winHeight() - $item.height() ) / 2
		});
	}
	
	function addCodePopups() {
		$.T('makerOverlays').insertAfter($outerlimits);
		var $getcode = $('#getcode'), $havecode = $('#havecode'), $codearea = $('#codearea');
		$codearea.height( winHeight() - 150 );
		center( $getcode );
		center( $havecode );
		$getcode.show();
		$('#btnGetCode').click( function() {
			$codearea.val( style + '\n\n' + body + '\n' );
			$havecode.show();
			document.codeform.codearea.focus()
			document.codeform.codearea.select()
		});
	}
	
	var style = T('style');
	$(style).appendTo('head');
	$.T('makerStyle').appendTo('head');
	var body = T('html') + '\n\n' + T('script');
	$outerlimits.html( body ).height( winHeight() );
	if( pref.gadgetType != 'iframe' ) addCodePopups( style, body );
	adjustHeight();
}

function gadgetReady() {
	
	function stateLocator() {
		var state = home.info.state;
		if( ! state  ||  state == stateUS ) return '';
		var url = state.gsx$wheretovote.$t;
		return url ? T( 'stateLocator', { url:url } ) : '';
	}
	
	function locationWarning() {
		return vote.locations && vote.locations.length ?
			T( 'locationWarning', { home: home.info.address }) :
			'';
	}
	
	//function expander( link, body ) {
	//	return S(
	//		'<div>',
	//			'<div>',
	//				'<a href="#" onclick="return expandit(this);">',
	//					link,
	//				'</a>',
	//			'</div>',
	//			'<div style="display:none; margin:8px;">',
	//				body,
	//			'</div>',
	//		'</div>'
	//	);
	//}
	
	//expandit = function( node ) {
	//	 $(node).parent().next().slideDown('slow');
	//	 return false;
	//}
	
	function electionInfo() {
		var elections = [];
		var state = home && home.info && home.info.state;
		if( state  &&  state != stateUS ) {
			//for( var i = 1;  i < 9;  ++i ) {
			//	var date = state['gsx$date'+i];
			//	if( date ) date = date.$t;
			//	if( date ) {
			//		date = dateFromMDY( date );
			//		if( date >= today )
			//			elections.push( perElectionInfo( state, date, state['gsx$type'+i].$t ) );
			//	}
			//}
			// Temp hack for MS/VA - hard code today's election
			elections.push( perElectionInfo( state, today, 'Election' ) );
		}
		return S(
			generalInfo( state ),
			elections.join(''),
			infoLinks(),
			attribution()
		);
	}
	
	function generalInfo( state ) {
		
		var comments = state.gsx$comments.$t;
		if( comments ) comments = S(
			'<div style="margin-bottom:0.5em;">',
				comments,
			'</div>'
		);
		
		var absenteeLinkTitle = {
			//'Early': 'Absentee ballot and early voting information',
			'Early': 'Absentee ballot information',
			'Mail': 'Vote by mail information'
		}[state.gsx$absentee.$t] || 'Get an absentee ballot';
		
		var absentee = S(
			'<div style="margin-bottom:0.5em;">',
				fix( state.gsx$absenteeautomatic.$t == 'TRUE' ?
					'Any %S voter may vote by mail.' :
					'Some %S voters may qualify to vote by mail.'
				),
			'</div>',
			infolink( 'gsx$absenteeinfo', absenteeLinkTitle )
		);
		
		return S(
			'<div style="margin-bottom:0.5em;">',
				'<div class="heading" style="margin-bottom:0.75em;">',
					fix( 'How to vote in %S' ),
				'</div>',
				infolink( 'gsx$electionwebsite', '%S election website' ),
				infolink( 'gsx$areyouregistered', 'Are you registered to vote?' ),
				absentee,
				//infolink( 'gsx$registrationinfo', state.abbr == 'ND' ? '%S voter qualifications' : 'How to register in %S', true ),
				'<div style="margin:1.0em 0 0.5em 0;">',
					state.name, ' voter hotline: ',
					'<span style="white-space:nowrap;">',
						state.gsx$hotline.$t,
					'</span>',
				'</div>',
				comments,
				formatLeos(),
			'</div>'
		);
		
		function fix( text, prefix ) {
			return( text
				.replace( '%S', S(
					prefix && state.prefix ? state.prefix  + ' ' : '',
					state.name
				) )
				//.replace( '%C', S(
				//	home.info.county // TODO?
				//) )
			);
		}
		
		function infolink( key, text, prefix ) {
			var url = state[key].$t;
			return ! url ? '' : S(
				'<div style="margin-bottom:0.5em;">',
					'<a target="_blank" href="', url, '">',
						fix( text, prefix ),
					'</a>',
				'</div>'
			);
		}
		
		function formatLeos() {
			var leos = vote && vote.poll && vote.poll.leoInfo || {};
			
			var out = [];
			leos.city_leo && leos.city_leo.forEach( function( leo ) {
				addLeo( out, leo );
			});
			addLeo( out, leos.county_leo );
			
			return ! out.length ? '' : S(
				'<div style="padding:0.5em 0 0.75em 0;">',
					'<div class="heading" style="margin-bottom:0.75em">',
						'Your Local Election Office',
					'</div>',
					out.length < 2 ? '' : S(
						'<div style="font-style:italic; margin-bottom:0.75em;">',
							'Your local election offices are listed below, but we were unable to determine which one serves your location. Please contact each office for more information:',
						'</div>'
					),
					out.join('<div style="padding:0.5em;"></div>'),
				'</div>'
			);
		}
		
		function addLeo( out, leo ) {
			if( ! leo  ||  ! leo.authority_name ) return;
			
			function H( t ) { return htmlEscape( t || '' ); }  // TODO: make this global
			var a = {
				name: H( leo.authority_name ),
				place: H( leo.municipality_name || leo.county_name ),
				line1: H( leo.street || leo.mailing_street ),
				city: H( leo.city || leo.mailing_city ),
				state: H( leo.state || leo.mailing_state || vote.poll.stateInfo.state_abbr ),
				zip: H( leo.zip || leo.mailing_zip ),
				hours: H( leo.hours ),
				phone: H( leo.phone ),
				fax: H( leo.fax ),
				email: H( leo.email ),
				url: H( leo.website )
			}
			if( /^\d/.test(a.url) ) a.url = '';  // weed out phone numbers
			
			var directions =
				a.line1 && a.city && a.state && a.zip &&
				! /^PO /i.test(a.line1) &&
				! /^P\.O\. /i.test(a.line1) &&
				! /^BOX /i.test(a.line1);
			
			out.push( S(
				'<div>',
					'<div style="margin-bottom:0.15em;">',
						linkIf( a.name, a.url ),
					'</div>',
					'<div>',
						a.line1,
					'</div>',
					'<div>',
						a.city ? S( a.city, ', ', a.state, ' ', a.zip || '' ) : '',
					'</div>',
					'<div>',
						'<table cellspacing="0" cellpadding="0">',
							a.phone ? '<tr><td>Phone:&nbsp;</td><td>' + a.phone + '</td></tr>' : '',
							a.fax ? '<tr><td>Fax:&nbsp;</td><td>' + a.fax + '</td></tr>' : '',
						'</table>',
					'</div>',
					//a.email ? S( '<div>', 'Email: ', linkto(a.email), '</div>' ) : '',
					'<div>',
						a.hours ? S( 'Hours: ', a.hours ) : '',
					'</div>',
					! directions ? '' : S(
						'<div style="margin-top:0.1em;">',
						'</div>',
						directionsLink( home, {
							info: {
								accuracy: Accuracy.address,
								address: oneLineAddress( a )
							}
						})
					),
				'</div>'
			) );
		}
	}
	
	function perElectionInfo( state, electionDay, electionName ) {
		
		var sameDay = state.gsx$sameday.$t != 'TRUE' ? '' : S(
			'<div style="margin-bottom:0.5em;">',
				state.name, ' residents may register to vote at their polling place on Election Day:<br />',
				formatDayDate( electionDay ),
			'</div>'
		);
		
		var deadlineText = {
			mail: {
				type: 'registration',
				mustbe: 'Registration must be postmarked by:<br />'
			},
			receive: {
				type: 'registration',
				mustbe: 'Election officials must receive your registration by:<br />'
			},
			inperson: {
				type: 'registration',
				mustbe: 'In person registration allowed through:<br />'
			},
			armail: {
				type: 'absentee ballot request',
				mustbe: 'Absentee ballot requests must be postmarked by:<br />'
			},
			arreceive: {
				type: 'absentee ballot request',
				mustbe: 'Election officials must receive your absentee ballot request by:<br />'
			},
			avmail: {
				type: 'completed absentee ballot',
				mustbe: 'Completed absentee ballots must be postmarked by:<br />'
			},
			avreceive: {
				type: 'completed absentee ballot',
				mustbe: 'Election officials must receive your completed absentee ballot by:<br />'
			}
		};
		
		var absentee = S(
			deadline( state, 'gsx$absrequestpostmark', 'armail' ),
			deadline( state, 'gsx$absrequestreceive', 'arreceive' ),
			deadline( state, 'gsx$absvotepostmark', 'avmail' ),
			deadline( state, 'gsx$absvotereceive', 'avreceive' )
		);
		var deadlines = (
			deadline( state, 'gsx$postmark', 'mail' )  || deadline( state, 'gsx$receive', 'receive' )
		) + deadline( state, 'gsx$inperson', 'inperson' );
		//if( ! deadlines  &&  state.abbr != 'ND'  &&  state.gsx$sameday.$t != 'TRUE' )
		//	deadlines = S(
		//		'<div style="margin-bottom:0.75em;">',
		//			'The deadline to mail your registration for the November 3, 2009 general election has passed. ',
		//			//state.gsx$regcomments.$t || '',
		//		'</div>'
		//	);
		var cands = candidates();
		return deadlines || absentee || sameDay || cands ? S(
			'<div style="margin-bottom:0.5em;">',
				'<div class="heading" style="margin:0.75em 0;">',
					formatDate(electionDay), ' ', electionName,
				'</div>',
				deadlines || '',
				'<div style="margin-bottom:1em;">',
					absentee,
				'</div>',
				sameDay,
				cands,
			'</div>'
		) : '';
		
		function fix( text, prefix ) {
			return( text
				.replace( '%S', S(
					prefix && state.prefix ? state.prefix  + ' ' : '',
					state.name
				) )
				//.replace( '%C', S(
				//	home.info.county // TODO?
				//) )
			);
		}
		
		//function biglist() {
		//	return S(
		//		'<div style="margin-bottom:0.5em;">',
		//			states.mapjoin( function( state ) {
		//				return S(
		//					'<div>',
		//						'<b>', state.name, '</b>',
		//					'</div>',
		//					deadline( state, 'gsx$postmark', '' )
		//				);
		//			}),
		//		'</div>'
		//	);
		//}
		
		function deadline( state, key, type ) {
			var before = +state[key].$t;
			if( before == '' ) return '';
			if( before == -999 ) before = 0;
			var dt = deadlineText[type];
			var date = electionDay - before*days;
			var remain = Math.floor( ( date - today ) / days );
			if( remain < 0 ) return '';
			var sunday = type == 'mail'  &&  new Date(date).getDay() == 0;
			
			var sundayNote =
				! sunday ? '' :
				remain > 1 ?
					'Note: Most post offices are closed Sunday. Mail your ' + dt.type + ' by Saturday to be sure of a timely postmark.' :
				remain == 1 ?
					'Note: Most post offices are closed Sunday. Mail your ' + dt.type + ' today to be sure of a timely postmark.' :
				remain == 0 ?
					"Note: Most post offices are closed today. You can still mail your ' + dt.type + ' if your post office is open and has a collection today." :
					'';
			
			sundayNote = sundayNote && S(
				'<div style="margin-bottom:0.75em;">',
					sundayNote,
				'</div>'
			);
			
			var left = remain < 1 /* ||  sunday && remain < 2 */ ? S(
				' (Today!)'
			) : remain < 2 ? S(
				' (Tomorrow!)'
			) : remain < 31 ? S(
				' (', remain, ' days from now)'
			) : '';
			return S(
				'<div style="margin-bottom:0.75em;">',
					dt.mustbe, formatDayDate(date), left,
				'</div>',
				sundayNote
			);
		}
		
		function candidates() {
			var contests = getContests();
			if( ! contests ) return '';
			contests = sortArrayBy( contests, 'ballot_placement', { numeric:true } );
			var randomize = contests[0].ballot.candidate[0].order_on_ballot == null;
			var randomizedMessage = ! randomize ? '' : S(
				'<div style="font-size:85%; font-style:italic; margin-top:0.5em">',
					'Candidates are listed in random order',
				'</div>'
			);
			var linkText = 'Sample Ballot'
			var ballotLink = ! vote.ballotLink ? '' : S(
				'<div style="padding:0 0 0.75em 0;">',
					'<a target="_blank" href="', vote.ballotLink, '" title="', linkText, '">',
						'<img style="border:0; width:17px; height:17px; margin-right:6px;" src="', imgUrl('pdficon_small.gif'), '" />',
						linkText,
					'</a>',
				'</div>'
			);
			return S(
				ballotLink,
				'<div>',
					randomizedMessage,
					contests.mapjoin( function( contest ) {
						var candidates = contest.ballot.candidate;
						candidates = randomize ?
							candidates.randomized() :
							sortArrayBy( candidates, 'order_on_ballot', { numeric:true } );
							
						return S(
							'<div class="heading" style="xfont-size:110%; margin-top:0.5em">',
								contest.office,
							'</div>',
							candidates.mapjoin( function( candidate ) {
								function party() {
									return candidate.party ? S(
										'<span style="color:#444; font-size:85%;">',
											' - ',
											candidate.party,
										'</span>'
									) : '';
								}
								return S(
									'<div>',
										linkIf( candidate.name, candidate.candidate_url ),
										party(),
									'</div>'
								);
							})
						);
					}),
				'</div>'
			);
		}
	}
	
	function directionsLink( from, to ) {
		from = from.info;
		to = to.info;
		//console.log( 'directions', '('+from.accuracy+')', from.address, '-', '('+to.accuracy+')', to.address );
		return to.accuracy < Accuracy.intersection ? '' : S(
			'<div>',
				'<a target="_blank" href="http://maps.google.com/maps?f=d&saddr=',
					from.accuracy < Accuracy.street ? '' : encodeURIComponent(from.address),
					'&daddr=', encodeURIComponent(to.address),
					'&hl=en&mra=ls&ie=UTF8&iwloc=A&iwstate1=dir"',
				'>',
					'Get directions',
				'</a>',
			'</div>'
		);
	}
	
	function setVoteHtml() {
		if( !( vote.info || vote.locations ) ) {
			$details.append( log.print() );
			adjustHeight();
			return;
		}
		//var largeMapLink = mapplet ? '' : S(
		//	'<div style="padding-top:0.5em;">',
		//		'<a target="_blank" href="http://maps.google.com/maps?f=q&hl=en&geocode=&q=', encodeURIComponent( a.address.replace( / /g, '+' ) ), '&ie=UTF8&ll=', latlng, '&z=15&iwloc=addr">',
		//			'Large map and directions &#187;',
		//		'</a>',
		//	'</div>'
		//);
		
		var extra = home.info.latlng && vote.info && vote.info.latlng &&
			directionsLink( home, vote );
		
		function voteLocation( infowindow ) {
			var loc = 'Your Voting Location';
			if( !( vote.locations && vote.locations.length ) )
				return '';
			if( vote.info )
				return formatLocations( vote.locations, null,
					infowindow
						? { url:'vote-icon-50.png', width:50, height:50 }
						: { url:'vote-pin-icon.png', width:29, height:66 },
					loc, infowindow, extra, true
				);
			return infowindow ? '' : formatLocations( vote.locations, null,
				{ url:'vote-icon-32.png', width:32, height:32 },
				loc + ( vote.locations.length > 1 ? 's' : '' ), false, extra, false
			);
		}
		
		if( mapplet ) {
			$details.append( longInfo() );
			vote.html = S(
				'<div style="', fontStyle, '">',
					voteLocation(),
					locationWarning(),
				'</div>'
			);
			vote.htmlInfowindow = S(
				'<div style="', fontStyle, '">',
					voteLocation( true ),
					//locationWarning(),
				'</div>'
			);
			adjustHeight();
		}
		else {
			if( ! sidebar ) $tabs.show();
			$details.html( longInfo() ).show();
			vote.html = infoWrap( S(
				log.print(),
				electionHeader(),
				homeAndVote()//,
				//'<div style="padding-top:1em">',
				//'</div>',
				//electionInfo()
			) );
			vote.htmlInfowindow = infoWrap( S(
				log.print(),
				electionHeader(),
				homeAndVote( true )//,
				//'<div style="padding-top:1em">',
				//'</div>',
				//electionInfo()
			) );
		}
		
		function homeAndVote( infowindow ) {
			var viewMessage = getContests() ?
				'View Candidates and Details' :
				'View Election Details';
			var viewLink = sidebar ? '' : S(
				'<div style="padding-top:0.75em;">',
					'<a href="#detailsbox" onclick="return selectTab(\'#detailsbox\');">',
						viewMessage,
					'</a>',
				'</div>'
			);
			return vote.info && vote.info.latlng ? S(
				voteLocation( true ),
				viewLink
				//stateLocator(),
				//locationWarning(),
				//'<div style="padding-top:0.75em">',
				//'</div>',
				//formatHome()
			) : S(
				formatHome(),
				//'<div style="padding-top:0.75em">',
				//'</div>',
				voteLocation( infowindow )/*,
				locationWarning()*/
			);
		}
		
		function longInfo() {
			return T( 'longInfo', {
				log: log.print(),
				header: electionHeader(),
				home: formatHome(),
				location: voteLocation(),
				stateLocator: stateLocator(),
				warning: locationWarning(),
				info: electionInfo()
			});
		}
	}
	
	function getContests() {
		var contests = vote && vote.poll && vote.poll.contests && vote.poll.contests[0];
		return contests && contests.length && contests;
	}
	
	function infoWrap( html ) {
		return T( 'infoWrap', { html:html } );
	}
	
	function initMap( go ) {
		if( mapplet ) {
			map = new GMap2;
			go();
		}
		else {
			google.load( 'maps', '2', { callback: function() {
				if( GBrowserIsCompatible() ) {
					map = new GMap2( $map[0], {
						//googleBarOptions: { showOnLoad: true },
						mapTypes: [
							G_NORMAL_MAP,
							G_SATELLITE_MAP,
							G_SATELLITE_3D_MAP
						]
					});
					map.addControl(
						winWidth() >= 400 && winHeight() >= 300 ?
							new GLargeMapControl3D :
							new GSmallZoomControl
					);
					map.addControl( new GMapTypeControl );
					go();
				}
			} });
		}
	}
	
	function loadMap( a ) {
		go();
		
		function ready() {
			setTimeout( function() {
				var only = ! vote.info  ||  ! vote.info.latlng;
				setMarker({
					place: home,
					image: 'marker-green.png',
					open: only,
					html: mapplet || ! only ? formatHome(true) : vote.htmlInfowindow || formatHome(true)
				});
				if( vote.info  &&  vote.info.latlng )
					setMarker({
						place: vote,
						html: vote.htmlInfowindow,
						open: true
					});
			}, 500 );
		}
		
		function setMarker( a ) {
			var icon = a.icon || new GIcon( G_DEFAULT_ICON );
			if( a.image ) icon.image = imgUrl( a.image );
			var marker = a.place.marker =
				new GMarker( a.place.info.latlng, { icon:icon });
			map.addOverlay( marker );
			var options = {
				maxWidth: mapplet ? 350 : Math.min( $map.width() - 100, 350 )
				/*, disableGoogleLinks:true*/
			};
			if( balloon ) {
				marker.bindInfoWindow( $(a.html)[0], options );
				if( a.open ) marker.openInfoWindowHtml( a.html, options );
			}
			else {
				GEvent.addListener( marker, 'click', function() {
					selectTab( '#detailsbox' );
				});
			}
		}
		
		function go() {
			setVoteHtml();
			
			var hi = home.info, vi = vote.info;
			
			if( ! mapplet ) {
				$tabs.html( tabLinks( initialMap() ? '#mapbox' : '#detailsbox' ) );
				if( ! sidebar ) $map.css({ visibility:'hidden' });
				setLayout();
				if( initialMap() ) {
					$map.show().css({ visibility:'visible' });
					if( ! sidebar ) $detailsbox.hide();
				}
				else {
					if( ! sidebar ) $map.hide();
					$detailsbox.show();
				}
			}
			
			if( ! hi ) return;
			if( vi  &&  vi.latlng ) {
				var directions = new GDirections( null/*, $directions[0]*/ );
				GEvent.addListener( directions, 'load', function() {
					GAsync( directions, 'getBounds', 'getPolyline', function( bounds, polyline ) {
						var ne = bounds.getNorthEast();
						var sw = bounds.getSouthWest();
						var n = ne.lat(), e = ne.lng(), s = sw.lat(), w = sw.lng();
						var  latpad = ( n - s ) / 4;
						var lngpad = ( e - w )  / 4;
						bounds = new GLatLngBounds(
							new GLatLng( s - latpad, w - lngpad ),
							new GLatLng( n + latpad*2, e + lngpad )
						);
						GAsync( map, 'getBoundsZoomLevel', [ bounds ], function( zoom ) {
							map.setCenter( bounds.getCenter(), Math.min(zoom,16) );
							polyline && map.addOverlay( polyline );
						});
					});
				});
				directions.loadFromWaypoints(
					[
						S( 'Your Home (', hi.address, ')@', hi.lat.toFixed(6), ',', hi.lng.toFixed(6) ),
						S( 'Your Voting Location (', vi.address, ')@', vi.lat.toFixed(6), ',', vi.lng.toFixed(6) )
					],
					{
						getPolyline: true
					}
				);
			}
			else {
				// Initial position with marker centered on home, or halfway between home and voting place
				var latlng = hi.latlng;
				if( vi  &&  vi.latlng ) {
					latlng = new GLatLng(
						( hi.lat + vi.lat ) / 2,
						( hi.lng + vi.lng ) / 2
					);
				}
				//var center = latlng;
				//var width = $map.width(), height = $map.height();
				map.setCenter( latlng, a.zoom );
			}
			
			if( mapplet ) {
				GEvent.addListener( map, 'click', function( overlay, point ) {
					if( !( overlay || point ) )
						analytics( 'directions' );
				});
			}
			else {
				// Move map down a bit
				//var point = map.fromLatLngToDivPixel( latlng );
				//point = new GPoint(
				//	point.x /*- width * .075*/,
				//	point.y - height * .275
				//);
				//map.setCenter( map.fromDivPixelToLatLng(point), a.zoom );
			}
			
			ready();
			spin( false );
		}
	}
	
	function formatLocations( locations, info, icon, title, infowindow, extra, mapped ) {
		
		function formatLocationRow( info ) {
			var special =
				info.address != '703 E Grace St, Richmond, VA 23219' ? '' :
				'<div style="font-size:90%; margin-bottom:0.25em;">GOVERNOR\'S MANSION</div>';
			var locality = info.city ? info.city : info.county ? info.county + ' County' : '';
			var address = T( 'address', {
				special: special,
				location: htmlEscape( info.location || '' ),
				street: info.street,
				state: locality ? locality  + ', ' + info.state.abbr :
					info.address.length > 2 ? info.address :
					info.state && info.state.name || '',
				zip: info.zip && info.zip.slice(0,5)
			});
			return T( 'locationRow', {
				iconSrc: imgUrl(icon.url),
				iconWidth: icon.width,
				iconHeight: icon.height,
				address: address,
				directions: info.directions || '',
				hours: info.hours ? 'Hours: ' + info.hours : '',
				extra: extra || ''
			});
		}
		
		var rows = info ?
			[ formatLocationRow(info) ] :
			locations.map( function( location ) {
				var a = location.address;
				return formatLocationRow({
					location: a && a.location_name || '',
					directions: location.directions || '',
					hours: location.pollinghours || '',
					address: '',
					street: ( a && a.line1 || '' ) + ( a && a.line2 ? '<br>' + a.line2 : '' ),
					city: a && a.city || '',
					state: a && a.state && statesByAbbr[ a.state.toUpperCase() ],
					zip: a && a.zip || ''
				});
			});
			
		return S(
			T( 'locationHead', {
				select: includeMap() ? 'onclick="return maybeSelectTab(\'#mapbox\',event);" style="cursor:pointer;"' : '',
				title: title
			}),
			rows.join(''),
			T( 'locationFoot', {
				unable: info && info.latlng || mapped ? '' : T('locationUnable')
			})
		);
	}
	
	function spin( yes ) {
		//console.log( 'spin', yes );
		$('#spinner').css({ visibility: yes ? 'visible' : 'hidden' });
	}
	
	function geocode( address, callback ) {
		var geocoder = new GClientGeocoder();
		geocoder[ mapplet ? 'getLocationsAsync' : 'getLocations' ]( address, callback );
	}
	
	function getleo( home, callback ) {
		
		var info = home.info;
		
		// Using old code only to do special case ballot links for HI this year
		if( info.state.abbr != 'HI' ) {
			callback();
			return;
		}
		
		gem.leoReady = function( leo ) {
			home.hiBallot = leo.hiBallot;
			callback();
		};
		
		var url = S( opt.codeUrl, 'leo/', info.state.abbr.toLowerCase(), '-leo.js' );
		$.getScript( cacheUrl( url, 60 ) );
		
	}
	
	function pollingApi( address, abbr, normalize, callback ) {
		if( ! address ) {
			callback({ status:'ERROR' });
			return;
		}
		var url = S(
			'http://pollinglocation.apis.google.com/?',
			normalize ? 'normalize=1&' : '',
			pref.electionId ? 'electionid=' + pref.electionId + '&' : '',
			'q=', encodeURIComponent(address)
		);
		log( 'Polling API:' );  log( url );
		getJSON( url, function( poll ) {
			callback( typeof poll == 'object' ? poll : { status:"ERROR" } );
		});
	}
	
	function lookupPollingPlace( inputAddress, info, callback ) {
		function ok( poll ) { return poll.status == 'SUCCESS'; }
		function countyAddress() {
			return S( info.street, ', ', info.county, ', ', info.state.abbr, ' ', info.zip );
		}
		// BEGIN DEMO CODE
		if( /1600 Pennsylvania Ave NW.* 20500, USA/.test( info.place.address ) ) {
			callback({
				status: 'SUCCESS',
				locations: [
					[{
						address: {
							line1: '2130 G ST NW',
							city: 'Washington',
							state: 'DC',
							zip: '20006',
							location_name: 'THE SCHOOL WITHOUT WALLS'
						}
					}]
				]
			});
			return;
		}
		// END DEMO CODE
		var abbr = info.state && info.state.abbr;
		pollingApi( info.place.address, abbr, false, function( poll ) {
			if( ok(poll) )
				callback( poll );
			else
				//pollingApi( countyAddress(), abbr, false, function( poll ) {
				//	if( ok(poll)  ||  ! inputAddress  )
				//		callback( poll );
				//	else
						pollingApi( inputAddress, abbr, true, callback );
				//});
		});
	}
	
	function getJSON( url, callback, cache ) {
		fetch( url, function( text ) {
			// TEMP
			//if( typeof text == 'string' ) text = text.replace( '"locality": }', '"locality":null }' );
			// END TEMP
			//console.log( 'getJson', url );
			//console.log( text );
			var json =
				typeof text == 'object' ? text :
				text == '' ? {} :
				eval( '(' + text + ')' );
			callback( json );
		}, cache );
	}
	
	function closehelp( callback ) {
		if( ! mapplet )
			return callback();
		
		var $remove = $('.removehelp');
		if( $remove.is(':hidden') )
			return callback();
		
		if( $.browser.msie ) {
			$remove.hide();
			return callback();
		}
		
		var count = $remove.length;
		$remove.slideUp( 350, function() {
			if( --count == 0 ) callback();
		});
	}
	
	function setGadgetPoll411() {
		var input = $('#Poll411Input')[0];
	    input.value = pref.example;
		Poll411 = {
			
			focus: function() {
				if( input.value == pref.example ) {
					input.className = '';
					input.value = '';
				}
			},
			
			blur: function() {
				if( input.value ==  ''  ||  input.value == pref.example ) {
					input.className = 'example';
					input.value = pref.example;
				}
			},
			
			submit: function() {
				$previewmap.hide();
				if( sidebar ) {
					submit( input.value );
				}
				else {
					$map.hide().css({ visibility:'hidden' });
					$search.slideUp( 250, function() {
						$spinner.show();
						submit( input.value );
					});
				}
				return false;
			}
		};
	}
	
	function submit( addr ) {
		submitReady = function() {
			analytics( 'lookup' );
			addr = $.trim( addr );
			log();
			log.yes = /^!!?/.test( addr );
			if( log.yes ) addr = $.trim( addr.replace( /^!!?/, '' ) );
			pref.normalize = /^\*/.test( addr );
			if( pref.normalize ) {
				log.yes = true;
				log( 'Setting normalize=1' );
				addr = $.trim( addr.replace( /^\*/, '' ) );
			}
			log( 'Input address:', addr );
			var state = statesByAbbr[ addr.toUpperCase() ];
			if( state ) addr = state.name;
			if( addr == pref.example ) addr = addr.replace( /^.*: /, '' );
			home = {};
			vote = {};
			map && map.clearOverlays();
			$spinner.show();
			$details.empty();
			closehelp( function() {
				geocode( addr, function( geo ) {
					var places = geo && geo.Placemark;
					var n = places && places.length;
					log( 'Number of matches: ' + n );
					if( ! n ) {
						spin( false );
						detailsOnly( S(
							log.print(),
							T('didNotFind')
						) );
					}
					else if( n == 1 ) {
						findPrecinct( geo, places[0], addr );
					}
					else {
						if( places ) {
							detailsOnly( T('selectAddressHeader') );
							var $radios = $('#radios');
							$radios.append( formatPlaces(places) );
							$detailsbox.show();
							adjustHeight();
							$details.find('input:radio').click( function() {
								var radio = this;
								spin( true );
								setTimeout( function() {
									function ready() {
										findPrecinct( geo, places[ radio.id.split('-')[1] ] );
									}
									if( $.browser.msie ) {
										$radios.hide();
										ready();
									}
									else {
										$radios.slideUp( 350, ready );
									}
								}, 250 );
							});
						}
						else {
							sorry();
						}
					}
				});
			});
		}
		
		submitReady();
	}
	
	function setLayout() {
		$body.toggleClass( 'sidebar', sidebar );
		var headerHeight = $('#header').visibleHeight();
		if( pref.logo ) {
			$('#Poll411Form > .Poll411SearchTable').css({
				width: $('#Poll411Form > .Poll411SearchTitle > span').width()
			});
		}
		var formHeight = $('#Poll411Gadget').visibleHeight();
		if( formHeight ) formHeight += 8;  // TODO: WHY DO WE NEED THIS?
		var height = winHeight() - headerHeight - formHeight - $tabs.visibleHeight();
		$map.height( height );
		$detailsbox.height( height );
		if( sidebar ) {
			var left = $detailsbox.width();
			$map.css({
				left: left,
				top: 0,
				width: winWidth() - left
			});
		}
	}
	
	$window.resize( setLayout );
	
	function detailsOnly( html ) {
		if( !( mapplet || sidebar ) ) {
			$tabs.html( tabLinks('#detailsbox') ).show();
			setLayout();
		}
		if( ! sidebar ) $map.hide();
		$details.html( html ).show();
		adjustHeight();
		spin( false );
	}
	
	function formatHome( infowindow ) {
		return S(
			'<div style="', fontStyle, '">',
				formatLocations(
					null,
					home.info,
					infowindow
						? { url:'home-icon-50.png', width:50, height:50 }
						: { url:'home-pin-icon.png', width:29, height:57 },
					'Your ' + home.info.kind, infowindow
				),
				//extra ? electionInfo() : '',
			'</div>'
		);
	}
	
	function findPrecinct( geo, place, inputAddress ) {
		log( 'Getting home map info' );
		home.info = mapInfo( geo, place );
		if( ! home.info  /*||  home.info.accuracy < Accuracy.address*/ ) { sorry(); return; }
		$selectState.val( home.info.state.abbr );
		var location;
		
		getleo( home, function() {
			lookupPollingPlace( inputAddress, home.info, function( poll ) {
				log( 'API status code: ' + poll.status || '(OK)' );
				vote.poll = poll;
				var norm = poll.normalized_input;
				//if( norm ) {
				//	home.info.street = norm.line1;
				//	if( norm.line2 ) home.info.street += '<br>' + norm.line2;
				//	home.info.city = norm.city.replace( 'Washington D.C.', 'Washington' );
				//	home.info.state = stateByAbbr( norm.state );
				//	home.info.zip = norm.zip;
				//}
				var locations = vote.locations = poll.locations && poll.locations[0];
				if( poll.status != 'SUCCESS'  ||  ! locations  ||  ! locations.length ) {
					sorry();
					return;
				}
				checkHiBallot();
				if( locations.length > 1 ) {
					log( 'Multiple polling locations' );
					setVoteNoGeo();
					return;
				}
				var address = locations[0].address;
				if(
					( address.line1 || address.line2 )  &&
					( ( address.city && address.state ) || address.zip )
				) {
					var addr = oneLineAddress( address );
					log( 'Polling address:', addr );
					geocode( addr, function( geo ) {
						var places = geo && geo.Placemark;
						setVoteGeo( geo, places, addr );
					});
				}
				else {
					log( 'No polling address' );
					setVoteNoGeo();
				}
			});
		});
		
		function checkHiBallot() {
			if( ! home.hiBallot ) return;
			var id = vote.locations[0].id;
			if( ! id ) return;
			id = id.slice( -4 );
			var ballot = home.hiBallot[id];
			if( ! ballot ) return;
			vote.ballotLink = S(
				'http://elections3.hawaii.gov/ppl/docs/ppl/BALLOTS/English/',
				ballot,
				'EN.pdf'
			);
		}
		
		function setVoteGeo( geo, places, address ) {
			//if( places && places.length == 1 ) {
			if( places && places.length >= 1 ) {
				// More than one place, use first match only if it has address
				// accuracy and the remaining matches don't
				if( places.length > 1 ) {
					if( places[0].AddressDetails.Accuracy < Accuracy.address ) {
						setVoteNoGeo();
						return;
					}
					for( var place, i = 0;  place = places[++i]; ) {
						if( places[i].AddressDetails.Accuracy >= Accuracy.address ) {
							setVoteNoGeo();
							return;
						}
					}
				}
				try {
					var coord = places[0].Point.coordinates;
					var lat = coord[1], lng = coord[0];
					var latlng = new GLatLng( lat, lng );
					var miles = latlng.distanceFrom( home.info.latlng ) / 1609.344;
					log( miles.toFixed(2) + ' miles to polling place' );
					if( miles > 30 ) {
						log( 'Polling place is too far away' );
						setVoteNoGeo();
						return;
					}
					var details = places[0].AddressDetails;
					var abbr = details.Country.AdministrativeArea.AdministrativeAreaName;
					var st = statesByName[abbr] || statesByAbbr[ abbr.toUpperCase() ];
					log( 'Polling state: ' + st.name );
					if( st != home.info.state ) {
						log( 'Polling place geocoded to wrong state' );
						setVoteNoGeo();
						return;
					}
					if( details.Accuracy < Accuracy.intersection ) {
						log( 'Polling place geocoding not accurate enough' );
						setVoteNoGeo();
						return;
					}
				}
				catch( e ) {
					log( 'Error getting polling state' );
				}
				log( 'Getting polling place map info' );
				setMap( vote.info = mapInfo( geo, places[0], vote.locations[0] ) );
				return;
			}
			setVoteNoGeo();
		}
		
		function setVoteNoGeo() {
			setVoteHtml();
			forceDetails();
		}
	}
	
	function sorry() {
		$details.html( log.print() + sorryHtml() );
		forceDetails();
	}
	
	function forceDetails() {
		setMap( home.info );
		if( !( mapplet || sidebar ) ) {
			$map.hide();
			$tabs.html( tabLinks('#detailsbox') ).show();
		}
		$detailsbox.show();
		adjustHeight();
		spin( false );
	}
	
	function sorryHtml() {
		return home && home.info ? S(
			'<div>',
				formatHome(),
				//'<div style="padding-top:0.75em">',
				//'</div>',
				//'<div style="margin-bottom:1em;">',
				//	'We are unable to provide voting location information for your address at this time. ',
				//	'Please check with your state or local election officials to find your voting location.',
				//'</div>',
				stateLocator(),
				electionInfo(),
			'</div>'
		) : S(
			'<div>',
			'</div>'
		);
	}
	
	function setMap( a ) {
		if( ! a ) return;
		if( ! mapplet ) {
			a.width = $map.width();
			$map.show().height( a.height = Math.floor( winHeight() - $map.offset().top ) );
		}
		loadMap( a );
	}
	
	function oneLineAddress( address ) {
		return S(
			address.line1 ? address.line1 + ', ' : '',
			address.line2 ? address.line2 + ', ' : '',
			address.city, ', ', address.state,
			address.zip ? ' ' + address.zip.slice(0,5) : ''
		);
	}
	
	function formatAddress( address ) {
		return htmlEscape( ( address || '' ).replace( /, USA$/, '' ) );
	}
	
	function formatPlaces( places ) {
		if( ! places ) return sorryHtml();
		
		var checked = '';
		if( places.length == 1 ) checked = 'checked="checked"';
		else spin( false );
		var list = places.map( function( place, i ) {
			var id = 'Poll411SearchPlaceRadio-' + i;
			place.extra = { index:i, id:id };
			return T( 'placeRadioRow', {
				checked: checked,
				id: 'Poll411SearchPlaceRadio-' + i,
				address: formatAddress(place.address)
			});
		});
		
		return T( 'placeRadioTable', { rows:list.join('') } );
	}
	
	var Accuracy = {
		country:1, state:2, county:3, city:4,
		zip:5, street:6, intersection:7, address:8, premise:9
	};
	var Kind = [ '', 'Country', 'State', 'County', 'City', 'Neighborhood', 'Neighborhood', 'Neighborhood', 'Home', 'Home' ];
	var Zoom = [ 4, 5, 6, 10, 11, 12, 13, 14, 15, 15 ];
	
	function mapInfo( geo, place, extra ) {
		extra = extra || {};
		var details = place.AddressDetails;
		var accuracy = Math.min( details.Accuracy, Accuracy.address );
		if( accuracy < Accuracy.state ) {
			log( 'Not accurate enough' );
			return null;
		}
		var country = details.Country;
		if( ! country ) {
			log( 'No country' );
			return null;
		}
		var area = country.AdministrativeArea;
		if( ! area ) {
			log( 'No AdministrativeArea' );
			return null;
		}
		var areaname = area.AdministrativeAreaName;
		var state =
			statesByName[areaname] ||
			statesByAbbr[ areaname.toUpperCase() ] ||
			statesByName[ ( place.address || '' ).replace( /, USA$/, '' ) ];
		if( ! state ) {
			log( 'No state' );
			return null;
		}
		var sub = area.SubAdministrativeArea || area, locality = sub.Locality;
		if( locality ) {
			log( 'Got Locality' );
			var county = sub.SubAdministrativeAreaName || locality.LocalityName;
			var city = locality.LocalityName;
			var street = locality.Thoroughfare;
			var zip = locality.PostalCode;
		}
		else if( area.AddressLine ) {
			log( 'Got AddressLine' );
			var addr = area.AddressLine[0] || '';
			if( addr.match( / County$/ ) )
				county = addr.replace( / County$/, '' );
			else
				city = addr;
		}
		var coord = place.Point.coordinates;
		var lat = coord[1], lng = coord[0];
		var formatted = formatAddress( place.address );
		log( 'Formatted address:', formatted );
		return {
			geo: geo,
			place: place,
			address: formatted,
			location: extra.address && extra.address.location_name,
			directions: extra.directions,
			hours: extra.hours,
			lat: lat,
			lng: lng,
			latlng: new GLatLng( lat, lng ),
			street: street && street.ThoroughfareName || '',
			city: city || '',
			county: county || '',
			state: state,
			zip: zip && zip.PostalCodeNumber || '',
			zoom: Zoom[accuracy],
			accuracy: accuracy,
			kind: Kind[accuracy],
			_:''
		};
	}
	
	//function setFiller() {
	//	function makePaths( poly ) {
	//		return 'path=weight:2|color:0x000000B0|fillcolor:0x00000010|enc:' + poly.encoded;
	//	}
	//	var filler = '';
	//	if( iframe ) {
	//		var w = $map.width(), h = Math.floor( winHeight() - $map.offset().top );
	//		if( w * h == 0 ) return;
	//		filler = S(
	//			'<div style="position:relative;">',
	//				// US:
	//				//'<img style="width:', w, 'px; height:', h, 'px; border:none;" src="http://maps.google.com/staticmap?center=38,-95.9&span=26.9,52.7&size=', w, 'x', h, '&key=', key, '" />'
	//				// VA:
	//				// TODO: Get encoded polyline working!
	//				'<img style="width:', w, 'px; height:', h, 'px; border:none;" src="http://maps.google.com/maps/api/staticmap?sensor=false&size=', w, 'x', h, '&key=', key, '&', stateOutlinePolys.map(makePaths).join('&'), '" />',
	//				pref.logo ?
	//					'<img style="position:absolute; left:0; top:0;" src="' + _IG_GetCachedUrl(pref.logo) + '" />' : '',
	//			'</div>'
	//		);
	//		$previewmap.html( filler );
	//	}
	//}
	
	function setupTabs() {
		var $tabs = $('#tabs');
		$tabs.click( function( event ) {
			var $target = $(event.target);
			if( $target.is('a') ) {
				var tab = $target.attr('href').replace( /^.*#/, '#' );
				selectTab( tab );
			}
			return false;
		});
	}
	
	selectTab = function( tab ) {
		if( mapplet ) return false;
		analytics( tab );
		$( $tabs.find('span')[0].className ).hide();
		if( tab == '#Poll411Gadget' ) {
			$details.empty();
			$tabs.hide();
			$spinner.css({ display:'none' });
			$map.hide();
			$search.slideDown( 250, function() {
				//$previewmap.show();
				setLayout();
				$map.show();
			});
		}
		else {
			$(tab).show().css({ visibility:'visible' });
			$tabs.html( tabLinks(tab) );
		}
		return false;
	};
	
	maybeSelectTab = function( tab, event ) {
		event = event || window.event;
		var target = event.target || event.srcElement;
		if( target.tagName.toLowerCase() != 'a' ) return selectTab( tab );
		return true;
	};
	
	if( mapplet ) {
		$.T('gadgetMappletStyle').appendTo('head');
		$.T('mappletStyle').appendTo('head');
		
		$.T( 'mappletBody', {
			example: htmlEscape( pref.example ),
			attribution: attribution()
		}).appendTo('#outerlimits');
	}
	else {
		$.T('style').appendTo('head');
		$.T('gadgetMappletStyle').appendTo('head');
		$.T('gadgetStyle').appendTo('head');
		
		$('body').prepend( S(
			pref.logo ? T('header') : '',
			T('html')
		) );
		$.T('gadgetBody').appendTo('#outerlimits');
	}
	
	var $search = $('#Poll411Gadget'),
		$selectState = $('#Poll411SelectState'),
		$tabs = $('#tabs'),
		$previewmap = $('#previewmap'),
		$map = $('#mapbox'),
		$details = $('#details'),
		$detailsbox = $('#detailsbox'),
		$spinner = $('#spinner'),
		$directions = $('#directions');
	
	if( ! mapplet ) {
		if( pref.ready ) $search.hide();
		else setGadgetPoll411();
		setLayout();
	}
	
	// http://spreadsheets.google.com/feeds/list/p9CuB_zeAq5X-twnx_mdbKg/2/public/values?alt=json
	var stateSheet = opt.dataUrl + 'leo/states-spreadsheet.json';
	
	getJSON( stateSheet, sheetReady, 60 );
	function sheetReady( json ) {
		json.feed.entry.forEach( function( state ) {
			statesByAbbr[ state.abbr = state.gsx$abbr.$t ] = state;
			statesByName[ state.name = state.gsx$name.$t ] = state;
			states.push( state );
		});
		
		indexSpecialStates();
		
		function polyState( abbr ) {
			gem.currentAbbr = abbr = abbr.toLowerCase();
			gem.shapeReady = function( json ) {
				if( json.state != gem.currentAbbr ) return;
				map.clearOverlays();
				json.shapes.forEach( function( poly ) {
					poly.points.push( poly.points[0] );
					var polygon = new GPolygon( poly.points, '#000000', 2, .7, '#000000', .07 );
					map.addOverlay( polygon );
				});
			};
			$.getScript( cacheUrl( S( opt.codeUrl, 'shapes/json/', abbr, '.js' ) ) );
		}
		
		zoomTo = function( abbr ) {
			if( ! abbr ) return;
			abbr = abbr.toUpperCase();
			var state = abbr == 'US' ? stateUS : statesByAbbr[abbr];
			if( ! state ) return;
			$('#Poll411SearchInput').val('');
			$selectState.val( abbr );
			home = { info:{ state:state }, leo:{ leo:{ localities:{} } } };
			vote = null;
			if( state != stateUS ) $details.html( electionInfo() );
			adjustHeight();
			function latlng( lat, lng ) { return new GLatLng( +lat.$t, +lng.$t ) }
			var bounds = new GLatLngBounds(
				latlng( state.gsx$south, state.gsx$west ),
				latlng( state.gsx$north, state.gsx$east )
			);
			GAsync( map, 'getBoundsZoomLevel', [ bounds ], function( zoom ) {
				map.setCenter( bounds.getCenter(), zoom );
				polyState( abbr );
			});
		}
		
		var abbr = pref.state;
		if( ! abbr ) {
			var loc = google.loader && google.loader.ClientLocation;
			var address = loc && loc.address;
			if( address  &&  address.country == 'USA' ) abbr = address.region;
		}
		abbr = abbr || 'US';
		
		initMap( function() {
			$selectState.bind( 'change keyup', function( event ) {
				zoomTo( $selectState.val() );
			});
			
			if( mapplet ) {
				zoomTo( abbr );
				
				(function() {
					function e( id ) { return document.getElementById('Poll411Search'+id); }
					var /*spinner = e('Spinner'),*/ /*label = e('Label'),*/ input = e('Input'), button = e('Button');
					button.disabled = false;
					
					window.Poll411Search = {
						
						focus: function() {
							//label.style.textIndent = '-1000px';
						},
						
						blur: function() {
							//if( input.value === '' )
							//	label.style.textIndent = '0px';
						},
						
						sample: function() {
							input.value = pref.example;
							this.submit();
							return false;
						},
						
						submit: function() {
							//spinner.style.backgroundPosition = '0px 0px';
							if( ! input.value ) input.value = pref.example;
							submit( input.value );
							return false;
						}
					};
					
					Poll411Search.focus();
					Poll411Search.blur();
					input.focus();
				})();
			}
			else {
				setupTabs();
				if( pref.ready )
					submit( pref.address || pref.example );
				else
					zoomTo( abbr );
			}
		});
	}
	
	analytics( 'view' );
}

function log() {
	if( arguments.length == 0 )
		log.log = [];
	else for( var i = -1, text;  text = arguments[++i]; ) {
		log.log.push( text );
		window.console && console.log && console.log( text );
	}
}

log.print = function() {
	return log.yes ? T( 'log', { content:log.log.join('<br />') } ) : '';
}

// Final initialization

maker && inline ? makerWrite() : gadgetWrite();
$(function() {
	T( 'ignore', null, function() {
		maker && inline ? makerReady() : gadgetReady();
	});
	$('body').click( function( event ) {
		var target = event.target;
		if( $(target).is('a') )
			analytics( $(target).attr('href') );
	});
});

})();
