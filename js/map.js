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
        "esri/dijit/Search",
        "esri/dijit/OverviewMap",
        "dojo/parser",
        "esri/toolbars/draw",
        "esri/graphic",
        "esri/graphicsUtils",
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
          Map, on,  dom,  Extent, ArcGISDynamicMapServiceLayer, FeatureLayer, BasemapGallery,
          Scalebar, Legend, Search, OverviewMap, parser, Draw, Graphic, graphicsUtils,
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
            var popupOptions = {
              fillSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                          new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25])),
              marginLeft: "20",
              marginTop: "20"
            };
            var popup = new Popup(popupOptions, domConstruct.create("div"));

            // Create the map
            var map = new Map("map", {
              basemap: "topo",
              zoom: 3,
              extent : extensionnueva,
              infoWindow: popup
            });
            
            // Capa general
            var USAdatos = new ArcGISDynamicMapServiceLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/", {
                opacity : 0.5,
            });

            // Capa ciudades
            var outFieldsCiudades = ["areaname", "class", "st", "capital"];

            var CiudadesUSA = new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0",{
              outFields: outFieldsCiudades
            });

            // Capa Estados con popUP
            var templateState = new PopupTemplate({
              title: "Estados: {STATE_NAME}",
              description: "Población: {POP2000} habitantes",
              visible: true                 
            });

            var statesLayer = new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2", {
              mode: FeatureLayer.MODE_SNAPSHOT,
              infoTemplate: templateState,
              outFields: ["*"]
            });
            
            //zoom en popup
            map.on("zoom",function(evt){
              popup.hide()
            });

            // Añadir datos al Mapa
            map.on("load", function(evt) {
              map.resize();
              map.reposition();
            });
              map.addLayers ([USAdatos, CiudadesUSA, statesLayer]);
              map.disableDoubleClickZoom ()
            

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
            var legendDijit = new Legend({
              map: map,
              arrangement : Legend.ALIGN_RIGHT,
              layerInfos: [{layer: USAdatos}]
              }, "legendDiv");
            legendDijit.startup();                                                                                                                                                                                
            
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
              //Evitamos  que al hacer click aparezca el popUP
              map.setInfoWindowOnClick(false);

              //Implementamos la herramienta de dibujar
              var tb = new Draw (map);
              tb.on("draw-end", displayPolygon);
            
                //añadimos geometria al mapa
                function displayPolygon (evt) {
                  var geometryInput = evt.geometry;
                  var tbDrawSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, 
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, 
                      new Color([255, 255, 0]), 2), new Color([255, 255, 0, 0.2]));
                  map.graphics.clear();
                  var graphicPolygon = new Graphic(geometryInput,tbDrawSymbol);
                  map.graphics.add(graphicPolygon);
                selectCiudad(geometryInput);
                }

                function selectCiudad(geometryInput) {
                      var symbolSelected = new SimpleMarkerSymbol({
                        "type": "esriSMS",
                        "style": "esriSMSCircle",
                        "color": [255, 115, 0, 128],
                        "size": 6,
                        "outline": {
                            "color": [255, 0, 0, 214],
                            "width": 1}
                      });
                      
                      CiudadesUSA.setSelectionSymbol(symbolSelected);
                      var BuscaCiudades = new Query();
                      BuscaCiudades.geometry = geometryInput;
                      CiudadesUSA.on("selection-complete", populateGrid);
                      CiudadesUSA.selectFeatures(BuscaCiudades, FeatureLayer.SELECTION_NEW);
                }
                
                var gridCIUDADES = new (declare([Grid, Selection]))({
                  bufferRows: Infinity,
                  columns: {
                      class:"class",
                      st: "st",
                      capital: "capital"
                  }
                }, "divGrid");

                function populateGrid(results) { 
                    var dataCiudad;

                    dataCiudad = array.map(results.features, function (feature) {
                      return {
                        "class": feature.attributes[outFieldsCiudades[1]],
                        "st": feature.attributes[outFieldsCiudades[2]],
                        "capital": feature.attributes[outFieldsCiudades[3]],
                      }
                    });

                    // Pasar los datos al grid
                    var memStore = new Memory({
                      data: dataCiudad
                    });
                    gridCIUDADES.set("store", memStore);
                }
            tb.activate(Draw.POLYGON);
          }
          //Añadir tarea borrar seleccion
          on(dojo.byId("BorrarSelecion"),"click",fborrarselecion);

          function fborrarselecion(){
            CiudadesUSA.clearSelection();
            map.graphics.clear();
            tb.deactivate();
            map.setInfoWindowOnClick(true);
          };
          // Añadir Tarea Selector de estados (busqueda)
          on(dojo.byId("progButtonNode"),"click",function (){
            map.setInfoWindowOnClick(true); 
            CiudadesUSA.clearSelection();
            map.graphics.clear();
            
          // Obtiene el dato metido en "dbt"
            var SelectorEstados = dojo.byId("dtb").value;

            // Definimos la simbologia del estado seleccionado
            var seleccionsimbolos = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, 
              new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 255, 0]), 2),
               new Color([255, 255, 0, 0.2])
            );
              
            // Asignamos simbología al estado selecionado
            statesLayer.setSelectionSymbol (seleccionsimbolos);

            // Realizamos la consulta
            var queryState = new Query ();
            queryState.where = `state_name = '${SelectorEstados}'`;
                
            statesLayer.selectFeatures(queryState, FeatureLayer.SELECTION_NEW, function(selection){
            //Zoom al estadado selecionado
              var centrarEstados = graphicsUtils.graphicsExtent(selection).getCenter();
              var extentSt = esri.graphicsExtent(selection);
              map.setExtent(extentSt.getExtent().expand(2));
              map.centerAt(centrarEstados);
            });
          });
        });
    