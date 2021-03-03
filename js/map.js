var map;
var tb;
    require(["esri/map",
        "dojo/on",
        "dojo/dom",
        "esri/geometry/Extent",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/layers/FeatureLayer",
        "esri/dijit/BasemapGallery",
        "esri/dijit/Scalebar",
        "esri/dijit/Legend",
        "esri/dijit/PopupMobile",
        "esri/dijit/Search",
        "esri/dijit/OverviewMap",
        "dojo/parser",
        "esri/toolbars/draw",
        "esri/graphic",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        
        "esri/tasks/query",
        "esri/tasks/IdentifyTask",
        "esri/tasks/IdentifyParameters",
        "esri/config",
        "esri/InfoTemplate",
        "esri/dijit/Popup",
        "esri/dijit/PopupTemplate",
        "esri/tasks/GeometryService",
        "dojo/dom-class",
        "dojo/_base/lang",

        "dojo/store/Memory",
        "dojo/date/locale",
        "esri/layers/DataAdapterFeatureLayer",

        "dojo/_base/Color",
        "dojo/_base/declare",
        "dojo/_base/array",

        "dgrid/OnDemandGrid",
        "dgrid/Selection",

        "dijit/layout/TabContainer",
        "dijit/layout/ContentPane",
        "dijit/layout/BorderContainer", 
        "dijit/form/Button",
        "esri/Color",
        "dojo/dom-construct",
        "dojo/domReady!"],
        function(
          Map, on,  dom, Extent, ArcGISDynamicMapServiceLayer, FeatureLayer, BasemapGallery,
          Scalebar, Legend, PopupMobile, Search, OverviewMap, parser, Draw, Graphic,
          SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Query, IdentifyTask, IdentifyParameters,
          esriConfig,  InfoTemplate, Popup, PopupTemplate, GeometryService, domClass, lang,
          Memory, locale, DataAdapterFeatureLayer,
          Color, declare, array, Grid, Selection,
          TabContainer, ContentPane, BorderContainer, Button, 
          Color, domConstruct,
          Ready,
        ) {

        //Añadimo variable de extensión para utilizar al crear el mapa
        var extensionnueva = new Extent({
          "xmin": -11535191.501121324,
          "ymin": 3796084.8695277404,
          "xmax": -7350110.356180864,
          "ymax": 12958702.8609162215,
          "spatialReference": { "wkid": 102100 }
        });
        //Añadimos variable de popup para utilizar en el mapa
        var popup = new Popup({
          fillSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
              new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]))
        }, domConstruct.create("div"));

        // Create the map
        var map = new Map("map", {
          basemap: "topo",
          zoom: 3,
          extent : extensionnueva,
          infoWindow: popup
        });

        // Construct the USA layer
        var USAdatos = new ArcGISDynamicMapServiceLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/", {
            opacity : 0.5,
        });
        
        var CiudadesUSA = new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0",{
          outFields: outFieldsCiudades
        });

        var outFieldsCiudades = ["areaname", "class", "st", "capital"];

        var templateState = new InfoTemplate();
        templateState.setContent(getTextContent);
        
        var statesLayer = new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2", {
          mode: FeatureLayer.MODE_SELECTION,
          outFields: ["state_name", "pop2000"],
          infoTemplate: templateState
        });

        // Añadir datos al Mapa
        map.on("load", function(evt) {
          map.resize();
          map.reposition();
          map.addLayer (USAdatos);
          map.addLayer(CiudadesUSA);
          map.disableDoubleClickZoom(); 
        });

        // Añadir BasemapGallery
        var SelectorMapas = new BasemapGallery({
            showArcGISBasemaps: true,
            map: map
          }, "basemapgalleryContenedor");
          SelectorMapas.startup();

        // Añadir Escala sobre el mapa, abajo a la izquierda en metros y millas
        var Scala = new Scalebar({
            map: map,
            scalebarUnit: "dual",
            attachTo: "bottom-center"
        });

        // Añadir Leyenda
        map.on("load", function(evt) {
            var legendDijit = new Legend({
              map: map,
              arrangement : Legend.ALIGN_RIGHT,
              layerInfos: [{layer: USAdatos}]
            }, "legendDiv");
            legendDijit.startup();                                                                                                                                                                                
        });
        
       // Añadir Buscador
       var  dijitSearch = new Search({
            map: map,
            autoComplete: true
        },"BuscadorGen");
        dijitSearch.startup();

        // Añadir Visor general
        var VisionGeneral = new OverviewMap ({
            map: map,
            visible: true
        }, "VGeneral");
        VisionGeneral.startup();

        // Añadir herramientas de selección y dibujo
        on(dojo.byId("pintaYQuery"),"click",fPintaYQuery);

        function fPintaYQuery() {
                /*
                 * Step: Implement the Draw toolbar
                 */
          var tb = new Draw (map);
          tb.on("draw-end", displayPolygon);
          tb.activate(Draw.POLYGON);
        }

        function displayPolygon(evt) {
        // Get the geometry from the event object
          var geometryInput = evt.geometry;

        // Define symbol for finished polygon
          var tbDrawSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 255, 0]), 2), new Color([255, 255, 0, 0.2]));

        // Clear the map's graphics layer
          map.graphics.clear();

        /*
        * Step: Construct and add the polygon graphic
        */
          var graphicPolygon = new Graphic(geometryInput,tbDrawSymbol);
          map.graphics.add(graphicPolygon);

        // Call the next function
        selectCiudad(geometryInput);
        }

        function selectCiudad(geometryInput) {
            // Define symbol for selected features
              var symbolSelected = new SimpleMarkerSymbol({
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "color": [255, 115, 0, 128],
                "size": 6,
                "outline": {
                    "color": [255, 0, 0, 214],
                    "width": 1
                }
              });
              /*
              * Step: Set the selection symbol
              */
              CiudadesUSA.setSelectionSymbol(symbolSelected);

              /*
              * Step: Initialize the query
              */
              var BuscaCiudades = new Query();
              BuscaCiudades.geometry = geometryInput;

              /*
              * Step: Wire the layer's selection complete event
              */
              CiudadesUSA.on("selection-complete", populateGrid);

              /*
              * Step: Perform the selection
              */
              CiudadesUSA.selectFeatures(BuscaCiudades, FeatureLayer.SELECTION_NEW);

        }
        // Initialize the dgrid
        var gridCIUDADES = new (declare([Grid, Selection]))({
          bufferRows: Infinity,
          columns: {
              arename: "areaname",
              class:"class",
              st: "st",
              capital: "capital"
          }
        }, "divGrid");

        function populateGrid(results) { 
            var gridData;

            dataCiudad = array.map(results.features, function (feature) {
                          return {
                              /*
                              * Step: Reference the attribute field values
                              */
                             "areaname": feature.attributes[outFieldsCiudades[0]],
                             "class": feature.attributes[outFieldsCiudades[1]],
                             "st": feature.attributes[outFieldsCiudades[2]],
                             "capital": feature.attributes[outFieldsCiudades[3]],
                          }
                      });

                      // Pass the data to the grid
                      var memStore = new Memory({
                          data: dataCiudad
                      });
                      gridCIUDADES.set("store", memStore);
         }

         //Añadir tarea borrar seleccion
         on(dojo.byId("BorrarSelecion"),"click",fborrarselecion);

         function fborrarselecion(){
          CiudadesUSA.clearSelection();
          map.graphics.clear();
          gridCIUDADES.clear();
          tb.deactivate();
        };


        // Añadir Tarea Selector de estados (busqueda)
        on(dojo.byId("progButtonNode"),"click",fQueryEstados);
        
        function fQueryEstados () {
          var seleccionsimbolos = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 12,
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([48, 178, 255, 0.8])));
          
          
          statesLayer.setSelectionSymbol (seleccionsimbolos);

          var SelectorEstados = dojo.byId("dtb1").value;

          var queryState = new Query ();
            queryState.where = `state_name = '${SelectorEstados}'`;
            
          statesLayer.selectFeatures(queryState, FeatureLayer.SELECTION_NEW, function(selection){
            var centrarEstados = graphicsUtils.graphicsExtent(selection).getCenter();
            var extentSt = esri.graphicsExtent(selection);
            map.setExtent(extentSt.getExtent().expand(2));
            map.centerAndZoom(centrarEstados);
          });
        }


        // Añadir funcion PopUP
        map.on("dbl-click", function (event) {
          var querypopUP = new Query();
          querypopUP.geometry = pointToExtent(map, event.mapPoint, 10);
          var deferred = statesLayer.selectFeatures(querypopUP,
            FeatureLayer.SELECTION_NEW);
          map.infoWindow.setFeatures([deferred]);
          map.infoWindow.show(event.mapPoint);
        });

        function getTextContent (graphic) {
          var attributes = graphic.attributes;
          var PoblaciondelEstado = attributes.pop2000;

          return  "Población del estado =" + PoblaciondelEstado;
        }

        function pointToExtent (map, point, toleranceInPixel) {
          var pixelWidth = map.extent.getWidth() / map.width;
          var toleranceInMapCoords = toleranceInPixel * pixelWidth;
          return new Extent(point.x - toleranceInMapCoords,
                            point.y - toleranceInMapCoords,
                            point.x + toleranceInMapCoords,
                            point.y + toleranceInMapCoords,
                            map.spatialReference);
        }
        
      });