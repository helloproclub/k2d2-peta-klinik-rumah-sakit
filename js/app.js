var RESULT_BROWSER = {
    Table: {
        class: 'TableResultBrowser'
    },
    ImageGrid: {
        class: 'ImageResultBrowser'
    },
    Map: {
        class: 'CoordinateResultBrowser'
    },
    BubbleChart: {
        class: 'BubbleChartResultBrowser'
    },
    LineChart: {
        class: 'LineChartResultBrowser',
    },
    BarChart: {
        class: 'BarChartResultBrowser',
    },
    ScatterChart: {
        class: 'ScatterChartResultBrowser',
    },
    AreaChart: {
        class: 'AreaChartResultBrowser',
    },
    TreeMap: {
        class: 'TreeMapResultBrowser'
    },
    Tree: {
        class: 'TreeResultBrowser'
    },
    Timeline: {
        class: 'TimelineResultBrowser'
    },
    Dimensions: {
        class: 'MultiDimensionResultBrowser'
    },
    Graph: {
        class: 'GraphResultBrowser'
    }
};

function getResultBrowser( query ) {
    var browser = null;
    var browserPackage = wikibase.queryService.ui.resultBrowser;

    try {
        var browserKey = query.match( /#defaultView:(\w+)/ )[1];
        var browserClass = RESULT_BROWSER[browserKey].class;
        browser = new browserPackage[browserClass]();
    } catch ( e ) {
        var browserClass = RESULT_BROWSER.Table.class;
        browser = new browserPackage[browserClass]();
    }
    return browser;
}

function renderEdit( query, callback ) {
    var ve = new wikibase.queryService.ui.visualEditor.VisualEditor();
    ve.setChangeListener( _.debounce( function( v ) {
        callback( v.getQuery() );
    }, 1500 ) );

    var $editor = $( '<div>' );
    ve.setQuery( query );
    ve.draw( $editor );
    $('.edit').on('click',function(e){
        e.preventDefault();
      }).popover( {
            placement: 'top',
            'html': true,
            'content': $editor
        } );
}

function renderQuery( query ) {

    var browser = getResultBrowser( query );
    var api = new wikibase.queryService.api.Sparql();
    $( '#query-result' ).hide();
    $( '#query-result' ).empty();
    $( '#progress' ).show();
    api.query( query ).done( function() {
        try {
            browser.setResult( api.getResultRawData() );
            $( '#query-result' ).show();
            browser.draw( $( '#query-result' ) );
            $( '#progress' ).hide();
        } catch ( e ) {
            $( '#progress' ).hide();
            $( '#error' ).show();
        }
    } ).fail( function() {
        $( '#progress' ).hide();
        $( '#error' ).show();
    } );
}

function pick_map(name){
	all = `
# languages of Indonesia details
#defaultView:Map
SELECT DISTINCT
  ?language
  ?languageLabel
  ?BPScode
  ?ISO
  ?IETF
  ?EL_ID
  ?omniglotURL
  ?EthURL
  ?EthStatus
  ?totalSpeakers
  ?totalSpeakersGroup
  ?coord
  ?urls
WHERE {
  hint:Query hint:optimizer "None" .
  {?language wdt:P31 wd:Q34770}UNION{BIND(wd:Q6488691 as ?language)}
  ?language wdt:P17 wd:Q252 .
  OPTIONAL {
    ?language wdt:P276 ?location .
    ?location wdt:P625 ?coord
  }
  OPTIONAL {?language wdt:P18 ?image}
  OPTIONAL {?language wdt:P1448 ?officialName}
  OPTIONAL {?language wdt:P2590 ?BPScode}
  OPTIONAL {?language wdt:P220 ?ISO}
  OPTIONAL {?language wdt:P305 ?IETF}
  OPTIONAL {?language wdt:P2192 ?EL_ID}
  OPTIONAL {
    ?language wdt:P3823 ?EthStatus
  }
  BIND(
      IF(BOUND(?EthStatus),
        IRI(CONCAT("https://www.ethnologue.com/language/", STR(?ISO))), ""
      )
      as ?EthURL
    )
  OPTIONAL {?language wdt:P1098 ?totalSpeakers}
  BIND(
      IF(?totalSpeakers < 1000000, "<1M",
      IF(?totalSpeakers < 2000000, "1M-2M",
      IF(?totalSpeakers < 5000000, "2M-5M",
      IF(?totalSpeakers < 10000000, "5M-10M",
      IF(?totalSpeakers < 20000000, "10M-20M",
      ">20M")))))
      AS ?totalSpeakersGroup)

  OPTIONAL
  {
      SELECT ?language ?coord (GROUP_CONCAT(DISTINCT ?refURL; SEPARATOR=", ") as ?urls)
      WHERE
      {
        hint:Query hint:optimizer "None" .
        ?language wdt:P31 wd:Q34770 .
        ?language wdt:P17 wd:Q252 .

        ?language ?p ?statement.
        ?statement ?ps ?object .
        ?property wikibase:statementProperty ?ps .
        ?property wikibase:claim ?p .

        ?statement prov:wasDerivedFrom ?ref .

        ?ref pr:P854 ?refURL
        FILTER (!REGEX(str(?refURL),"(www.ethnologue|omniglot).com"))
      }
      GROUP BY ?language ?coord

  }

  OPTIONAL {
    ?language ?p ?statement.
    ?statement ?ps ?object .
    ?property wikibase:statementProperty ?ps .
    ?property wikibase:claim ?p .

    ?statement prov:wasDerivedFrom ?ref .

    ?ref pr:P854 ?omniglotURL 
    FILTER (CONTAINS(str(?omniglotURL),"omniglot."))
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "id" }
}
	`;
	return all;
}             

function refresh_map() {
    renderQuery( pick_map() );
}

function fix_popups() {
    $.each( $(".leaflet-popup-content SPAN[title]"), function() {
        this.outerHTML = '<b>' + this.title + '</b>: ' + this.outerHTML
    } );
}

$( document ).ready( function() {
    var query = pick_map();
    renderQuery( query );
    renderEdit( query, renderQuery );
} );
