var map;
var tb;
require([
  "esri/map",
  "esri/layers/FeatureLayer",
  "esri/dijit/FeatureTable",
  "esri/geometry/Extent",
  "esri/dijit/Legend",
  "esri/dijit/HomeButton",
  "esri/dijit/Search",
  "esri/dijit/BasemapGallery",
  "esri/dijit/OverviewMap",
  "esri/dijit/Scalebar",
  
  "esri/toolbars/draw",
  "esri/graphic",
  "esri/graphicsUtils",
  
  "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/Color",
  
  "esri/tasks/query",
  
  "esri/dijit/PopupTemplate",
  
  "dojo/on",
  
  "dijit/TitlePane",
  "dijit/layout/TabContainer",
  "dijit/layout/ContentPane",
  "dijit/layout/BorderContainer",
  "dojo/domReady!"
],
function(
  Map, FeatureLayer, FeatureTable, Extent, Legend, HomeButton, Search, BasemapGallery, OverviewMap, Scalebar,
  Draw, Graphic, graphicsUtils,
  SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Color,
  Query,
  PopupTemplate,
  on
){
    
  on(dojo.byId("pintaYQuery"), "click", fPintaYQuery);
  on(dojo.byId("progButtonNode"), "click", fQueryEstados);
  
  //PARA REALIZAR LA SEELCIÓN DE LAS CIUDADES
  function fPintaYQuery(){
    
    tb = new Draw (map);
    tb.on("draw-end",function (evt) {
      
      // gemoetria del evento
      var geometryInputCities = evt.geometry;
      
      //definicion de la simbologia del poligono
      var tbSymbolCities = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID, 
        new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 255, 0]), 2), new Color([255, 255, 0, 0.2])
      );
          
      //borra los poligonos dibujados
      map.graphics.clear();
      
      //Para añadir el Graphic layer al mapa. 
      var graphicPolygon = new Graphic(geometryInputCities, tbSymbolCities);
      map.graphics.add(graphicPolygon);
      
      //funcion para selecionar las ciudades
      //Simbolo de seleción  de las ciudades
      var sbSelectCities = new SimpleMarkerSymbol({
        "type": "esriSMS",
        "style": "esriSMSCircle",
        "color": [252,146,114],
        "size": 10,
        "outline": {
          "color": [222,45,38],
          "width": 1
        }
      });
          
      ftCities.setSelectionSymbol(sbSelectCities);
      
      //Hace la seleción apartir de la area dibuja en el mapa
      var queryCities = new Query();
      queryCities.geometry = geometryInputCities;
      // ftCities.on("selection-complete");
      ftCities.selectFeatures(queryCities, FeatureLayer.SELECTION_NEW, function(features){
        TableCities.filterSelectedRecords()
      });
    });
    tb.activate(Draw.POLYGON); 
  }
      
  // Limpiar selección de las ciudades
  on(dojo.byId("clear"),"click",fClearCities);
  
  function fClearCities (){
    ftCities.clearSelection();
    map.graphics.clear();
    TableCities.clearFilter()
    tb.deactivate()
  }
      
  //PARA SELECIONAR EL ESTADO
  
  //seleciona el Estado enfunción del estado introducido en el input
  function fQueryEstados(){
    
    var inputState = dojo.byId("dtb").value; //obtine el estado del input
    
    //Simbologia del estado selecionado
    var sbState = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
      new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
      new Color([255,0,0]), 2),new Color([255,255,0,0.5])
    );
        
    //asignación de la simbologia a la entidad selecionada
    ftStates.setSelectionSymbol(sbState);
    
    //Definición de la consulta
    var queryState = new Query();
    queryState.where ="state_name =" + "'" + inputState + "'"; // expreisón para hacer la selección
    
    ftStates.selectFeatures(queryState, FeatureLayer.SELECTION_NEW, function (selection){
      var centerSt = graphicsUtils.graphicsExtent(selection).getCenter();
      var extentSt = esri.graphicsExtent(selection);
      
      map.setExtent(extentSt.getExtent().expand(2));
      map.centerAt(centerSt);
    });
    
    //Funcion para que haga un zoom extesión sobre el estado seleccionado
    
  }
    
    //Definición de la extensión incial del mapa
    var extentInitial = new Extent({
      "xmin":-67684839.08072203,
      "ymin":2841314.1133827716,
      "xmax":-38646106.28707815,
      "ymax":11607724.013350733,
      "spatialReference":{"wkid":102100}// identificador del CRS
    });
    
    //Parametros del Mapa
    map = new Map("map", {
      basemap: "topo",
      extent: extentInitial, //define la extension inical del mapa
      zoom: 4,
      sliderStyle: "small",
    });
    
    //Widget para volver a la extension inicial
    var homeButton = new HomeButton({
      map: map,
      extent: extentInitial,
      visible: true
    }, "HomeButton");
    homeButton.startup()
    
    
    map.on("load", function(evt) {
      map.resize();
      map.reposition();
    });
    
    
    //Configuración de la ventana emergente para obtener infomación de la capa de States
    var popupStates = new PopupTemplate({
      title: "Estado de {state_name}, {state_abbr}",
      fieldInfos: [{
        fieldName: "pop2000",
        label: "Población:",
        visible: true
      }, {
        fieldName: "pop00_sqmi",
        label: "Población por sqmi:",
        visible: true
      }, {
        fieldName: "ss6.gdb.States.area",
        label: "Area en sqmi:",
        visible: true,
        format: {places: 0}
      }]
    });
    
    //Capa de Cities
    window.ftCities = new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0",{
    outFields:["*"]
  }); 
  
  //Capa de Highways
  var ftHighways = new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/1");
  
  //Capa de States
  var ftStates = new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2", {
  infoTemplate: popupStates, //llama la ventana emergente
  outFields:["*"] //llama a todos los campos de la capa
});

//Capa de Counties
var ftCounties =new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/3", {opacity: 0.35});

//Añadir las capas al mapa
map.addLayers([ftStates, ftCounties, ftHighways, ftCities]);

//Widget para visualizar la leyenda del mapa
var legend = new Legend ({
  map: map
},"legendDiv");
legend.startup();

//Widget busquedas
var search = new Search({
  map: map,
}, "Search");
search.startup();

//widget para cambiar el mapa base
var basemapGallery = new BasemapGallery({
  map:map
},"basemapGallery");

basemapGallery.startup();

//Widget de Overview
var Overview = new OverviewMap({
  map:map,
  visible: true,
  attachTo: "bottom-left",
  height: 200,
  width:200
});
Overview.startup();

//Widget de la escala
var scalebar = new Scalebar({
  map: map,
  attachTo: "bottom-center",
  scalebarUnit: "metric"
});

ftCities.on("load", function(){
  TableCities =  new FeatureTable({
    featureLayer : ftCities,
    map : map,
    outFields:["st", "areaname","class", "pop2000"],
    syncSelection: true,
    zoomToSelection:true,
    fieldInfos: [
      {
        name: 'st',
        alias: 'Estado'
      },
      {
        name: 'areaname',
        alias: 'Ciudad'
      },{
        name: 'class',
        alias: 'Clase'
      },{
        name: 'pop2000',
        alias: 'Habitantes'
      }],
    }, "TableNode");
    
    TableCities.startup();
  })   
}); 