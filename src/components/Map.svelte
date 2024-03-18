<script>
  // @ts-nocheck
  import {
    dataStore,
    rangeValue,
    buttonICSP,
    rangeValueAccord,
    storeIndicateur5,
    storeIndicateur,
    heightNavBar,
    accordMode,
    scaleStore,
    storeCommune,
    storeAccordsBeneficiaire,
    storeIcspCommune,
  } from '../../shared/store';
  import Pagination from '../components/Pagination.svelte';
  import {
    getSumOf,
    findMinMax,
    findAllObjectsByAttribute,
    uniqueValues,
    calculateTotalByRegion,
    formattedValue,
    sumISPValues,
    transformDataForBarChart,
    optionForBarChart,
    optionForLineChart,
    getSumPerYear,
    getSumSuperficy,
    uniqueValuesInArrayOfObject,
    rechercheMulticriteres,
    rechercheMulticriteresPourFEICOM,
    sortByDescendingOrder,
    sortByAscendingOrder,
    zoomToFeatureByValue,
    fetchIdCommunesFromCommunesID,
    getOverallBbox
  } from '../../shared/utilitaire';
  import {
    Drawer,
    Button,
    CloseButton,
    SidebarDropdownWrapper,
    Card,
    Listgroup,
    Tooltip,
    Chart,
    Tabs,
    Badge,
    TabItem,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell
  } from 'flowbite-svelte';
  import {
    InfoCircleSolid,
    ArrowRightOutline,
    BadgeCheckOutline,
    CashOutline,
    ChartOutline,
    LandmarkOutline,
    GridSolid,
    MailBoxOutline,
    UsersGroupOutline,
    UsersOutline,
    UserOutline,
    NewspapperOutline,
    LinkOutline,
    EnvelopeOutline,
    MapPinAltSolid
  } from 'flowbite-svelte-icons';
  import { sineIn } from 'svelte/easing';
  import {
    MapLibre,
    GeolocateControl,
    NavigationControl,
    ScaleControl,
    AttributionControl,
    FullscreenControl,
    Control,
    ControlGroup,
    ControlButton,
    VectorTileSource,
    FillLayer,
    LineLayer,
    hoverStateFilter,
    JoinedData,
    GeoJSON,
    MarkerLayer,
    SymbolLayer,
    Popup
  } from 'svelte-maplibre';
  import maplibregl from 'maplibre-gl';
  import { onMount, onDestroy } from 'svelte';
  import { each } from 'chart.js/helpers';

  let clickedFeature;
  let trigger = true;
  let width;
  let dataArr2 = [];
  let dataForMap = [];
  let mandatData = [];
  let icspData = [];
  let communeData = [];
  let regionData =[];
  let keyCommuneID_Commune = [];
  let statisticsPerRegion = [];
  let MinMax = {};
  let geojsonRegionCentroid;
  let geojsonDepartementCentroid;
  let geojsonMunicipaliteCentroid;
  let unsubscribe;
  let nom_commune;
  let detailsMandatCommune = [];
  let clickedLayerInfo = null; // Variable to store information about the clicked layer
  let anneeDebutMandat = [];
  let anneeFinMandat = [];
  let theme='info'; // this variable will is replacing showICSP since we have now really 3 thematics;
  let currentZoom = 0;
  let previousZoom=0;
  let showFinancement;
  let valueSliderICSP = 0; // Initialisez avec une valeur par défaut
  let valueSliderAccord = []; // Initialisez avec une valeur par défaut
  let valeurAccordMode ='' ; // determine if data in the card of "appuis financiers " should be base number of projects or amount of projects 
  let storeIndicateur5ForMap = {};
  let storeIndicateurForMap = {};
  let mapFilterIndicateur5 = {};
  let mapFilterIndicateur = {};
  let hidden8 = true;
  let dataForBarChart = {};
  let dataForLineChart = {};
  let optionsForChart = {};
  let optionsForChartLine = {};
  let allProject = [];
  let scale;
  let getbbox = [];
  const zoomMaxRegion = 6;
  const zoomMaxDep = 6;
  const zoomMaxMun = 6;
  let heightNavBarForSideBar;
  let sidebarId;
  let showDep = false;
  let showCom = false;
  let showReg = true;
  let toolTipStyle="bg-white text-black font-normal z-10";
  let generalInfoItemStyle="flex items-center gap-1 mb-2 text-sm font-medium text-gray-900 dark:text-white";
  let generalInfoValueStyle="ml-1 text-xs text-gray-500 truncate dark:text-gray-400";
  let currentGeo = 'reg';
  let resultat;
  let heightSideBar;
  // START EXTRACT
  let map = maplibregl.Map | undefined;
  let loaded = false;

  let center = [12, 6];
  let zoom = 5;
  let getIdCommuneForZoom='';

  // bbox du Cameroun
  let bbox = [
    [-6.81, -6.492371],
    [31.841812, 18.227069]
  ];

  let paintProperties = {
    'fill-opacity': hoverStateFilter(0.7, 0.4),
    'fill-color': [
      'case',
      ['!=', ['feature-state', 'value'], null],
      [
        'interpolate',
        ['linear'],
        ['feature-state', 'value'],
        MinMax.min,
        'rgba(222,235,247,1)',
        MinMax.max,
        'rgba(49,130,189,1)'
      ],
      'rgba(255, 255, 255, 0)'
    ]
  };
  let hiddenBackdropFalse = true;

  let transitionParamsBottom = {
    y: 320,
    duration: 200,
    easing: sineIn
  };

  let transitionParamsRight = {
    x: 320,
    duration: 200,
    easing: sineIn
  };
  let currentGeneralInfo;
  let layer='reg';
  let lastLayerUpdateTime='0';
  // On mount
  onMount(async () => {
    const response = await fetch('./data/limite_region_centroide.geojson');
    geojsonRegionCentroid = await response.json();

    const responseDepartement = await fetch('./data/limite_departement_centroide.geojson');
    geojsonDepartementCentroid = await responseDepartement.json();

    const responseMunicipalite = await fetch('./data/limite_municipalite_centroide.geojson');
    geojsonMunicipaliteCentroid = await responseMunicipalite.json();

    unsubscribe = dataStore.subscribe((store) => {
      dataArr2 = store.dataArr;
      mandatData = store.mandatData;
      icspData = store.icspData;
      communeData = store.communeData;
      regionData = store.regionData;
      keyCommuneID_Commune = store.keyCommuneID_Commune;
    });

    // Récupération de la data provenant de layout.svete
    rangeValue.subscribe(($rangeValue) => {
      valueSliderICSP = $rangeValue;
    });

    storeCommune.subscribe(($idCommune)=>{
      getIdCommuneForZoom=[$idCommune];
      try {
        updateGetBox(getIdCommuneForZoom);
      } catch (error) {
        
      }
    })

    accordMode.subscribe(($accodMode)=>{
      valeurAccordMode = $accodMode;
    })
    
    // Récupération de la data provenant de layout.svete
    storeIndicateur5.subscribe(($storeIndicateur5) => {
      storeIndicateur5ForMap = $storeIndicateur5;
    });

    // Récupération de la data provenant de layout.svete
    storeIndicateur.subscribe(($storeIndicateur) => {
      storeIndicateurForMap = $storeIndicateur;
    });

    // Récupération de la data provenant de layout.svete
    rangeValueAccord.subscribe(($rangeValueAccord) => {
      valueSliderAccord = $rangeValueAccord;
    });

    // Récupération de la data provenant de layout.svete
    heightNavBar.subscribe(($heightNavBar) => {
      heightNavBarForSideBar = $heightNavBar;
    });

    // Abonnez-vous au store pour recevoir les mises à jour
    buttonICSP.subscribe(($theme) => {
        // Mettez à jour la valeur locale avec la valeur du store
        theme = $theme; 
        if(showDep){// thius means that we we in the theme "appuis financier " cause it's the only theme to have the scale dep. so when we switch to another theme we have to go back to the scale region 
          toggleLayer('reg');
        }
        
    });
    if (theme==='icsp') {
      dataForMap = icspData;
    } else if(theme==='info') {
      dataForMap = communeData;
    }else{
      dataForMap = dataArr2;
    }
  });

  // Sélectionnez l'élément du drawer par son identifiant
  sidebarId = document.getElementById('sidebar6');

  // Reactivité
  $: {
    let indicateur;
    let communesCommunes = [];
    if (showCom) {
      scale = 'id_COMMUNE';
      toggleLayer('com');
    } else if (showReg) {
      scale = 'id_REGION';
      toggleLayer('reg');
    } else {
      scale = 'id_DEPARTEMENT';
      toggleLayer('dep');
    }
    scaleStore.set(scale);
    if (sidebarId) {
      heightSideBar = sidebarId.offsetHeight;
    }
    if (dataForMap.length > 0 && trigger == true) {
      if (
        (storeIndicateurForMap.accord.some((item) => item.indicateur === 'Bénéficiaire') &&
          dataForMap.length > 0) ||
        (storeIndicateurForMap.icsp.some((item) => item.indicateur === 'COMMUNE') &&
          dataForMap.length > 0)
      ) {

        // Déclarez l'indicateur dans une variable
        if (dataForMap.length > 0 && trigger == true) {
          if (map && loaded) {
            if (storeIndicateurForMap.accord.some((item) => item.indicateur === 'Bénéficiaire') &&!(theme==='icsp'))
            {
              indicateur = 'Bénéficiaire';
              communesCommunes = storeIndicateurForMap.accord.find(
                (item) => item.indicateur === indicateur
              ).data;
            } else if (
              storeIndicateurForMap.icsp.some((item) => item.indicateur === 'COMMUNE') &&
              (theme==='icsp')
            ) {
              indicateur = 'COMMUNE';
              communesCommunes = storeIndicateurForMap.icsp.find(
                (item) => item.indicateur === indicateur
              ).data;
            }

            let getID=fetchIdCommunesFromCommunesID(
              communesCommunes,
              keyCommuneID_Commune,
              'id_COMMUNE',
              'key'
            );
            if(theme!=='info'){
              updateGetBox(getID);
              storeCommune.set('');
            }else{
              updateGetBox(getIdCommuneForZoom);
            }
          }
        }
      } else {
        // Cas où aucune condition n'est satisfaite, donc CommunesCommunes est un tableau vide
        communesCommunes = [];
      }
      if (theme==='icsp') {
        if (getbbox.length > 0) {
          scale = 'id_COMMUNE';
          toggleLayer('com');
        }
        dataForMap = icspData;
        statisticsPerRegion = calculateTotalByRegion(
          dataForMap,
          valueSliderICSP[0],
          valueSliderICSP[1],
          scale,
          storeIndicateurForMap.icsp
        );


        MinMax = findMinMax(statisticsPerRegion, 'value');
      } else if(theme==='accord'){
        if (getbbox.length > 0) {
          scale = 'id_COMMUNE';
          toggleLayer('com');
        }
        dataForMap = dataArr2;
        mapFilterIndicateur = rechercheMulticriteres(dataForMap, storeIndicateurForMap.accord);
        statisticsPerRegion = getSumPerYear(
          mapFilterIndicateur,
          valueSliderAccord[0],
          valueSliderAccord[1],
          valeurAccordMode,
          scale
        );

        if (statisticsPerRegion.length > 0) {
          MinMax = findMinMax(statisticsPerRegion, 'value');
        } else {
          // Gérer le cas où statisticsPerRegion est vide
          MinMax = { min: 0, max: 0 };
        }
      }else{
        if (getbbox.length > 0) {
          scale = 'id_COMMUNE';
          toggleLayer('com');
        }
        dataForMap=communeData;
        statisticsPerRegion = getSumSuperficy(
          dataForMap,
          scale
        );
        if (statisticsPerRegion.length > 0) {
          MinMax = findMinMax(statisticsPerRegion, 'value');
        } else {
          // Gérer le cas où statisticsPerRegion est vide
          MinMax = { min: 0, max: 0 };
        }
      }

      paintProperties = getUpdatedPaintProperties(MinMax);
    }
  }

  function updateGetBox(getID){
    getbbox = fetchIdCommunesFromCommunesID(getID, communeData, 'bbox', 'id_COMMUNE');
    const overallBbox = getOverallBbox(getbbox);
    if (getbbox.length > 0) {
      map.fitBounds(overallBbox, {
        padding: 20, // Espace de marge autour de la BoundingBox
        maxZoom: 15 // Niveau de zoom maximal
      });
    } else {
      map.fitBounds(bbox, {
        duration: 500,
        center: center,
        zoom: zoom // Niveau de zoom maximal
      });
    }
  }

  function handleLayerClick(e) {
    // Set the variable with information about the clicked layer
    clickedLayerInfo = e;
    if (showCom) {
      nom_commune = e.detail.features[0].properties['ref:COG'];
      detailsMandatCommune = findAllObjectsByAttribute(mandatData, 'id_COMMUNE', nom_commune);
      anneeDebutMandat = sortByDescendingOrder(detailsMandatCommune, 'DEBUT MANDAT');
      anneeFinMandat = sortByDescendingOrder(detailsMandatCommune, 'FIN MANDAT');
      const indexCommune = communeData.findIndex((commune)=>commune.id_COMMUNE === e.detail.features[0].properties['ref:COG']) 
      currentGeneralInfo=communeData[indexCommune];
    }
    if(theme === 'info' && showReg){
      const indexRegion = regionData.findIndex((region)=>region.id_REGION === e.detail.features[0].properties['ref:COG']) ;
      currentGeneralInfo=regionData[indexRegion];
      const indexSuperficy = statisticsPerRegion.findIndex((region)=>region.id_REGION === e.detail.features[0].properties['ref:COG']);
      currentGeneralInfo=
      {
        ...currentGeneralInfo,
        superficy: statisticsPerRegion[indexSuperficy].value
      }
      hiddenBackdropFalse=false;
      
    }else if (theme!=='icsp') {
      nom_commune = e.detail.features[0].properties['ref:COG'];
      allProject = rechercheMulticriteresPourFEICOM(
        dataForMap,
        nom_commune,
        scale,
        valueSliderAccord[0],
        valueSliderAccord[1],
        storeIndicateurForMap.accord
      );

      hiddenBackdropFalse = false;
    } else {
      // Set the variable with information about the clicked layer
      // Set hiddenBackdropFalse to false to show the Drawer
      const region = e.detail.features[0].properties['ref:COG'];
      const label_reg = e.detail.features[0].properties.name;

      dataForBarChart.data = transformDataForBarChart(
        dataForMap,
        region,
        valueSliderICSP[0],
        valueSliderICSP[1],
        scale
      );
      dataForLineChart.data = sumISPValues(dataForMap, region, scale);
      dataForLineChart.geo = label_reg;
      dataForBarChart.year = valueSliderICSP[0] + ' / ' + valueSliderICSP[1];
      dataForBarChart.geo = label_reg;

      // Calcul de la somme des valeurs "y"
      dataForBarChart.sum = dataForBarChart.data.reduce(
        (total, currentItem) => total + currentItem.y,
        0
      );
      hiddenBackdropFalse = false;

      return dataForBarChart;
    }

    // Set hiddenBackdropFalse to false to show the Drawer
  }

  // Dans votre composant Svelte
  function handleLayerClickIfNeeded(e) {
    if (showCom) {
      handleLayerClick(e);
    }
  }



  function getUpdatedPaintProperties(MinMax) {
    return {
      'fill-opacity': hoverStateFilter(0.6, 0.8),
      'fill-color': [
        'case',
        ['!=', ['feature-state', 'value'], null],
        [
          'interpolate',
          ['linear'],
          ['feature-state', 'value'],
          MinMax.min,
          'rgba(222,235,247,1)',
          MinMax.max,
          'rgba(49,130,189,1)'
        ],
        'rgba(255, 255, 255, 0)'
      ]
    };
  }

  /**
   * when a commune is selected, we need to remove zoom before being able to toggle the layer
  */
  function clearFilterBeforeToggleZoom(layer){
    if(getbbox!==[]){
      if(theme==='icsp'){
        storeIcspCommune.set(false);
      }else if (theme==='accord'){
        storeAccordsBeneficiaire.set(false);
      }
      storeCommune.set('');
      updateGetBox('');
      setTimeout(() => {
        toggleLayer(layer);
      }, 1000);
    }else{
       toggleLayer(layer);
    }
  } 

  function toggleLayer(layer) {
    
    showReg = layer === 'reg' ? true : false;
    showDep = layer === 'dep' ? true : false;
    showCom = layer === 'com' ? true : false;
    
    // Supprimez la classe "active" de tous les boutons
    const buttons = document.querySelectorAll('.maplibregl-ctrl-icon');
    buttons.forEach((button) => {
      button.classList.remove('active');
    });

    // Ajoutez la classe "active" uniquement au bouton cliqué
    const button = document.querySelector(`#${layer}`);
    if (button) {
      button.classList.add('active');
    }

    // Pour forcer l'actualisation des Labels REG et DEP
    if (map) {
      if (!getOverallBbox) {
        map.setZoom(map.getZoom() + 0.0000001);
      }
    }
  }
  
  //automalticaly change the scale
  function toggleLayerOnZoom(){
    const currentTime = Date.now();
    let tempLayer=layer;
    if(currentZoom>previousZoom){
      if(currentZoom>5.1 && showReg && theme==='accord'){
        tempLayer ='dep';
      }else if(currentZoom>=5.75 && !showCom){
        tempLayer='com';
      }
    }else{
      if(currentZoom<5.1 && !showReg){
        tempLayer='reg';
      }else if(currentZoom<=5.75 && showCom && theme==='accord'){
        tempLayer='dep';
      }
    }
    if(currentTime-lastLayerUpdateTime<1000 && layer===tempLayer){
      return;
    }else{
      layer=tempLayer;
      lastLayerUpdateTime=Date.now();
      toggleLayer(layer);
      
      previousZoom=currentZoom;
    }
    
  }

  //changer l'affichage ISP par ICSP
  function changeItemToDisplay(data){
    let formalizedData=[];
    for (let i=0;i<data.length; i++){
      data[i].x='ICSP'+(1+i);
      formalizedData.push(data[i]);
    }
    return formalizedData
  }

  function displayItemValue(value) {
  if (value == null) {
    return `<span class="text-[15px] italic">Non disponible</span>`;
  } else {
    return `<span class="text-[15px] font-medium">${value}</span>`;
  }
}

  // On se désabonne pour éviter les fuites de data
  onDestroy(() => {
    unsubscribe;
  });

</script>

<svelte:window bind:innerWidth={width} />
<Drawer
  placement="right"
  style="top:{heightNavBarForSideBar}px"
  class="lg:w-2/5 md:w-1/3 sm:w-1/2 w-auto !p-0"
  transitionType="fly"
  backdrop={true}
  transitionParams={transitionParamsRight}
  bind:hidden={hiddenBackdropFalse}
  id="sidebar6"
>
  <div class="bg-[#00862b14] div-wrapper min-h-full">
    <Tabs style="full" class="space-x-0 w-full flex !flex-nowrap bg-white">
      {#if (theme==='info')}
        
        <TabItem class="w-full" open>
          <div slot="title" class="flex w-full justify-center text-lg items-center gap-2">
            <LandmarkOutline size="md" />
            Informations générales sur le territoire selectionné
            <h5
              id="historique"
              class="inline-flex items-center mb-4 text-sm font-light text-gray-400 dark:text-gray-200"
            >
            </h5>
          </div>

          
          <div id="detailMandatForAMunicipality" class="p-3 list-none flex justify-center h-full" >
            <Card padding="md" class="leading-[24px] mb-4 mt-2 !max-w-md w-full">
              <h2 class="mb-2 text-center text-black !uppercase text-4xl poppins-medium">
                {#if showCom }
                  {clickedLayerInfo.detail.features[0].properties.name}
                {:else}
                  {currentGeneralInfo["nom_REGION"]}
                {/if}
              </h2>
              {#if showCom && anneeFinMandat}
                <dl
                  class="max-w-screen-xl gap-8 p-2 mx-auto text-gray-900  dark:text-white sm:p-8"
                >
                  {#if anneeFinMandat[0].SUPERFICIE}
                    <div class="flex items-center justify-center">
                      <dt class="ml-1 text-3xl font-extrabold w-full text-center">
                        {formattedValue(anneeFinMandat[0].SUPERFICIE) || ''}
                      </dt>
                      <dd class="text-gray-500 ml-1 dark:text-gray-400">km²</dd>
                    </div>
                  {/if}
                  {#if anneeFinMandat[0].POPULATION}
                    <div class="flex items-center justify-center">
                      <dt class="ml-1 text-3xl font-extrabold w-full text-center">
                        {formattedValue(anneeFinMandat[0].POPULATION) || ''}
                      </dt>
                      <dd class="text-gray-500 ml-1 dark:text-gray-400">Habitants</dd>
                    </div>
                  {/if}
                </dl>

                <Card class="mb-2 !px-1 !max-w-xl  w-full">
                  <ul role="list" class="divide-y divide-gray-200 dark:divide-gray-700">
                    {#each anneeFinMandat as detailMandat}
                      {#if detailMandat['FIN MANDAT'] === anneeFinMandat[0]['FIN MANDAT']}
                        <li class=" py-1 sm:py-2">
                          <div class="flex items-start">
                            <div class="leading-3 flex-1 min-w-0 ms-4 mr-4">
                              <p class={generalInfoItemStyle} >
                                <UserOutline class="text-gray-700" size="sm" />
                                Maire: 
                                <span class={generalInfoValueStyle} >{detailMandat["CONSEILLER"]}</span>
                              </p>
                              <p class={generalInfoItemStyle}>  
                                <UsersOutline class="text-gray-700" size="sm" />
                                Adjoints Au maire: 
                                <span class={generalInfoValueStyle} >
                                  {detailMandat["Nombre des adjoints aux Maires"]} 
                                </span>
                              </p>
                              <p class={generalInfoItemStyle}>
                                <UsersGroupOutline class="text-gray-700" size="sm" />
                                Conseillers Municipaux: 
                                <span class={generalInfoValueStyle} >
                                  {detailMandat["Nombre de conseillers municipaux"]} 
                                </span>
                              </p>
                              <p class={generalInfoItemStyle} >
                                <MailBoxOutline class="text-gray-700"  size="sm" />
                                BP :  
                                <span class={generalInfoValueStyle} >{currentGeneralInfo["Boîte postale de la Mairie"]}</span> 
                              </p>

                              {#if currentGeneralInfo["Email mairie"]}
                                <p class={generalInfoItemStyle} >
                                  <EnvelopeOutline class="text-gray-700"  size="sm" />
                                  Adresse email :  
                                  <span class={generalInfoValueStyle} >
                                    <a href="mailto:{currentGeneralInfo["Email mairie"]}">{currentGeneralInfo["Email mairie"]}</a>
                                  </span> 
                                </p>
                              {/if}

                              {#if currentGeneralInfo["Longitude"] &&  currentGeneralInfo["Latitude"] }
                                <p class={generalInfoItemStyle} >
                                  <MapPinAltSolid class="text-gray-700"  size="sm" />
                                  Coordonnées(long, lat) :  
                                  <span class={generalInfoValueStyle}> {currentGeneralInfo["Longitude"]} ;  {currentGeneralInfo["Latitude"]}</span> 
                                </p>
                              {/if}

                              {#if currentGeneralInfo["Site Web de la Mairie"] !==null}
                                <p class={generalInfoItemStyle} >
                                  <LinkOutline size="sm" />
                                  Site web:
                                  <span class={"cursor-pointer "+generalInfoValueStyle} on:click={()=>{
                                    window.open("https://"+currentGeneralInfo["Site Web de la Mairie"],"_blank");
                                  }} > {currentGeneralInfo["Site Web de la Mairie"]}</span>
                                </p>
                              {/if}
                              <p class={generalInfoItemStyle}>
                                <NewspapperOutline class="text-gray-700"  size="sm" />
                                Date de création: 
                                <span class={generalInfoValueStyle} >{currentGeneralInfo["Annee de creation"]}</span> 
                              </p>

                            </div>
                            
                            <div
                              class="text-sm font-semibold text-gray-900 dark:text-white"
                            >
                              <Badge color="green" rounded class="px-3.5 py-0.5">
                                {detailMandat.PARTI || ''}
                              </Badge>
                            </div>
                          </div>
                        </li>
                      {/if}
                    {/each}
                  </ul>
                </Card> 
              {:else if (showReg)}
              <dl
              class="max-w-screen-xl gap-8 p-2 mx-auto text-gray-900  dark:text-white sm:p-8"
                  >
                <div class="flex items-center justify-center">
                  <dt class="ml-1 text-3xl font-extrabold w-full text-center">
                    {formattedValue(currentGeneralInfo.superficy)|| ''}
                  </dt>
                  <dd class="text-gray-500 ml-1 dark:text-gray-400">km²</dd>
                </div>
              </dl>
              <Card class="mb-2 !px-1 !max-w-xl  w-full">
                <ul role="list" class="divide-y divide-gray-200 dark:divide-gray-700">
                  <li class=" py-1 sm:py-2">
                    <div class="flex items-start">
                      <div class="leading-3 flex-1 min-w-0 ms-4 mr-4">
                        <p class={generalInfoItemStyle} >
                          <UserOutline class="text-gray-700" size="sm" />
                          President conseil: 
                          <span class={generalInfoValueStyle} >{currentGeneralInfo["nom_president"]}</span>
                        </p>
                        <p class={generalInfoItemStyle}>  
                          <UsersOutline class="text-gray-700" size="sm" />
                          1er Vice President: 
                          <span class={generalInfoValueStyle} >
                            {currentGeneralInfo["nom_vice_president1"]} 
                          </span>
                        </p>
                        <p class={generalInfoItemStyle}>  
                          <UsersOutline class="text-gray-700" size="sm" />
                          2eme Vice President: 
                          <span class={generalInfoValueStyle} >
                            {currentGeneralInfo["nom_vice_president2"]} 
                          </span>
                        </p>

                      </div>
                    </div>
                  </li>
                </ul>
              </Card> 
              {/if}
            </Card>
          </div>
          
        </TabItem>
      
      {:else if (theme==='accord')}
        
        <TabItem open class="w-full" id="projets">
          <div slot="title" class="flex w-full justify-center text-lg items-center gap-2">
            <GridSolid size="sm" />
            Liste de l'ensemble des appuis financiers
            <h5
              id="projets"
              class="inline-flex items-center mb-4 text-sm font-light text-gray-400 dark:text-gray-200"
            >
            </h5>
          </div>

          <h2 class="mb-6 text-center text-black-900 text-xl poppins-medium">
            {clickedLayerInfo.detail.features[0].properties.name} <br />
            <span class="text-gray-500 dark:text-gray-400 text-sm font-normal me-1">
              Nombre de projets : {allProject.length}</span
            >
          </h2>
          <ul class=" px-8 w-full flex flex-col items-center">
            {#each sortByAscendingOrder(allProject,'Année financement')  as resultat}
              <Card class="leading-[24px] mb-6 !max-w-md w-full">
                <Listgroup class="border-0 dark:!bg-transparent ">
                  <div class="flex items-center space-x-2 rtl:space-x-reverse">
                    <div class="flex-1 min-w-0">

                      <div>
                        <span class="text-base font-medium text-gray-900 dark:text-white">
                          Intitulé du projet :
                        </span>
                        {@html displayItemValue(resultat['Intitulé projet amélioré'])}
                      </div>

                      <div>
                        <span class="text-base font-medium text-gray-900 dark:text-white">
                          Bénéficiaire :
                        </span>
                        {@html displayItemValue(resultat['Bénéficiaire'])}
                      </div>

                      <div>
                        <span class="text-base font-medium text-gray-900 dark:text-white">
                          Date d'octroi financement :
                        </span>
                        {@html displayItemValue(resultat["Date d'octroi financement"])}
                      </div>

                      <div>
                        <span class="text-base font-medium text-gray-900 dark:text-white">
                          Montant :
                        </span>
                        {#if (value == null)} 
                          <span class="text-[15px] italic">Non disponible</span>
                        {:else}
                          <span class="text-[15px] font-medium">${value} FCFA</span>
                        {/if}
                      </div>

                      <div>
                        <span class="text-base font-medium text-gray-900 dark:text-white">
                          Instance d'attribution :
                        </span>
                        {@html displayItemValue(resultat["Instance d'attribution"])}
                      </div>

                      <div>
                        <span class="text-base font-medium text-gray-900 dark:text-white">
                          Niveau d’avancement :
                        </span>
                        {@html displayItemValue(resultat["Niveau d’avancement"])}
                      </div>
                    </div>
                  </div>
                </Listgroup>
              </Card>
            {/each}
          </ul>
        </TabItem>
      {:else}
        <TabItem open class="w-full hover:text-blue-900">
          <Tooltip triggeredBy="#stat" type="auto">
            Statistique des ICSP dans le temps pour un territoire choisi
          </Tooltip>
          <div slot="title" class="flex w-full justify-center text-lg items-center gap-2">
            <GridSolid size="sm" />
            Stats des ICSP
            <h5
              id="stat"
              class="inline-flex items-center mb-4 text-sm font-light text-gray-400 dark:text-gray-200"
            >
              <InfoCircleSolid class="w-4 h-4 mt-4 me-2.5" />
            </h5>
          </div>

          <div class="p-4 lg:w-full sm:w-full flex justify-center mb-4">
            <!-- Contenu de la deuxième div -->
            {#await dataForLineChart then}
              {#if dataForLineChart.data.data}
                <!-- Utilisation de h-full pour occuper 100% de la hauteur -->
                <Card class="!max-w-md w-full">
                  <div
                    class="w-full flex justify-center items-center pb-4 mb-4 border-b border-gray-200 dark:border-gray-700"
                  >
                    <div class="flex items-center">
                      <div
                        class="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center me-3"
                      >
                        <ChartOutline class="w-6 h-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <h5
                          class="leading-none text-2xl font-bold text-gray-900 dark:text-white pb-1 poppins-medium"
                        >
                          Evolution de l'ICSP <br />
                          <p class="text-sm font-normal text-gray-500 dark:text-gray-400">
                            <dt class="text-gray-500 dark:text-gray-400 text-sm font-normal me-1">
                              Territoire : {dataForBarChart.geo}
                            </dt>
                          </p>
                        </h5>
                      </div>
                    </div>
                  </div>
                  {#await optionForLineChart(dataForLineChart.data.label, dataForLineChart.data.data) then options}
                    <!-- Utilisation de h-auto pour que la hauteur s'adapte au contenu -->
                    <Chart {options} />
                  {/await}
                </Card>
              {/if}
            {/await}
          </div>
          <div class="p-4 lg:w-full sm:w-full flex justify-center">
            <!-- Contenu de la première div -->
            {#await dataForBarChart then}
              {#if dataForBarChart.data}
                <Card class="!max-w-md w-full">
                  <!-- Utilisation de h-full pour occuper 100% de la hauteur -->
                  <div
                    class="w-full h-full flex justify-center items-center pb-4 mb-4 border-b border-gray-200 dark:border-gray-700"
                  >
                    <div class="flex items-center">
                      <div
                        class="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center me-3"
                      >
                        <CashOutline class="w-6 h-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <h5
                          class="leading-none text-2xl font-bold text-gray-900 dark:text-white pb-1 poppins-medium"
                        >
                          ICSP pour le territoire : {dataForBarChart.geo}
                        </h5>
                        <p class="text-sm font-normal text-gray-500 dark:text-gray-400">
                          <dt class="text-gray-500 dark:text-gray-400 text-sm font-normal me-1">
                            Total ICSP pour la période {dataForBarChart.year} :
                          </dt>
                          <dd class="text-gray-900 text-sm dark:text-white font-semibold">
                            {formattedValue(dataForBarChart.sum)} FCFA
                          </dd>
                        </p>
                      </div>
                    </div>
                  </div>

                  {#await optionForBarChart(changeItemToDisplay(dataForBarChart.data)) then options}
                    <!-- Utilisation de h-auto pour que la hauteur s'adapte au contenu -->
                    <Chart {options} />
                  {/await}
                </Card>
              {/if}
            {/await}
          </div>
        </TabItem
        >
      {/if}
    </Tabs>
  </div>
</Drawer>

<!-- Use the reactive dataArr to update the JoinedData component -->
{#if dataForMap.length > 0 && trigger == true}
  <MapLibre
    style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    {center}
    {zoom}
    maxBounds={bbox}
    attributionControl={false}
    on:zoomend={({ detail: { map } }) => (currentZoom = map.getZoom())}
    bind:map
    bind:loaded
    on:zoom={()=>toggleLayerOnZoom()}
    class="w-screen"
  >
    <NavigationControl position="top-right" />
    <GeolocateControl position="top-right" fitBoundsOptions={{ maxZoom: 25 }} />
    <FullscreenControl position="top-right" />
    <ScaleControl />
    
    
    
    <Control position="top-left" class="flex flex-col gap-y-2">
      <ControlGroup >

        <Tooltip triggeredBy="#reg-tooltip" class={toolTipStyle} placement ='right' >
          Échelle régionale
        </Tooltip>
        <div id="reg-tooltip">
          <ControlButton id="reg" class={showReg ? 'bg-gray-200' : ''} on:click={() => clearFilterBeforeToggleZoom('reg')}>REG</ControlButton>
        </div>

        {#if theme==='accord'}
          <Tooltip triggeredBy="#dep-tooltip" class={toolTipStyle} placement ='right' >
            Échelle départementale
          </Tooltip>
          <div id="dep-tooltip">
            <ControlButton id="dep" class={showDep ? 'bg-gray-200' : ''} on:click={() => clearFilterBeforeToggleZoom('dep')}>DEP</ControlButton>
          </div>
        {/if}

        <Tooltip triggeredBy="#com-tooltip" class={toolTipStyle} placement ='right' >
          Échelle communale
        </Tooltip>
        <div id="com-tooltip">
          <ControlButton id="com" class={showCom ? 'bg-gray-200 rounded-bl rounded-br' : ''} on:click={() => toggleLayer('com')}>COM</ControlButton>
        </div>
      </ControlGroup>
    </Control>

     <GeoJSON data="/data/mask.geojson">
      <FillLayer paint={{ 'fill-color': 'black', 'fill-opacity': 0.6 }} />
    </GeoJSON>
    {#if showReg}
      <VectorTileSource url="pmtiles://data/regions.pmtiles" id="regions" promoteId="ref:COG">
        <FillLayer
          paint={paintProperties}
          manageHoverState
          hoverCursor="pointer"
          sourceLayer="regions"
          on:click={handleLayerClick}
        />
        <LineLayer
          paint={{
            'line-opacity': 1,
            'line-width': 1,
            'line-color': 'black'
          }}
          sourceLayer="regions"
        />

        <JoinedData data={statisticsPerRegion} idCol="id_REGION" sourceLayer="regions" />
        <!-- Contenu à afficher si theme==='icsp'-->
      </VectorTileSource>

      <GeoJSON data={geojsonRegionCentroid}>
        <JoinedData data={statisticsPerRegion} idCol="id_REGION" />
        <MarkerLayer let:feature>
          {#each statisticsPerRegion as { id_REGION, value , dataAmount}}
            {#if feature.properties['ref:COG'] === id_REGION}
              <div
                class="bg-gray-100 bg-opacity-50 bg-trans rounded-full p-2 shadow align flex flex-col items-center"
              >
                <div class="text-sm poppins-medium">{feature.properties.name}</div>
                {#if (theme==='icsp')}
                  <!-- Afficher la valeur avec l'unité 'FCFA' -->
                  <div class="text-sm poppins-light">{formattedValue(value)} FCFA</div>
                {:else if (theme==='info')}
                  <!-- Afficher la valeur avec l'unité 'Km2' -->
                  <div class="text-sm poppins-light text-center">
                    {formattedValue(value)} km² 
                  </div>
                {:else }
                  <div class="text-sm poppins-light text-center">
                    <!-- afficher le nombre de concours financiers ou le montant total de ces concours financers --> 
                    {#if (valeurAccordMode==='projet')}
                      <div class="text-sm poppins-light">{formattedValue(value)} <!--Financement(s)--> </div>
                    {:else}
                      <div class="text-sm poppins-light">{formattedValue(value)} FCFA</div>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        </MarkerLayer>
      </GeoJSON>
    {/if}
    {#if showDep}
      <VectorTileSource url="pmtiles://data/departements.pmtiles" promoteId="ref:COG">
        <JoinedData data={statisticsPerRegion} idCol="id_DEPARTEMENT" sourceLayer="departements" />

        <FillLayer
          hoverCursor="pointer"
          paint={paintProperties}
          manageHoverState
          sourceLayer="departements"
          on:click={handleLayerClick}
        />
        <LineLayer
          paint={{
            'line-opacity': 1,
            'line-width': 1,
            'line-color': 'gray'
          }}
          sourceLayer="departements"
        />
      </VectorTileSource>
    {/if}
    {#if showDep}
      <GeoJSON data={geojsonDepartementCentroid} promoteId="ref:COG">
        <JoinedData data={statisticsPerRegion} idCol="id_DEPARTEMENT" />
        <MarkerLayer let:feature>
          {#each statisticsPerRegion as { id_DEPARTEMENT, value }}
            {#if feature.properties['ref:COG'] === id_DEPARTEMENT}
              <div
                class="bg-gray-100 bg-opacity-50 rounded-full p-2 shadow align flex flex-col items-center"
              >
                <div class="text-sm poppins-medium">{feature.properties.name}</div>
                {#if (theme==='icsp')}
                  <!-- Afficher la valeur avec l'unité 'FCFA' -->
                  <div class="text-sm poppins-light">{formattedValue(value)} FCFA</div>
                {:else}
                  <!-- Afficher la valeur avec l'unité 'projet' -->
                  {#if (valeurAccordMode==='projet')}
                    <div class="text-sm poppins-light">{formattedValue(value)} <!--Financement(s)-->   </div>
                  {:else}
                    <div class="text-sm poppins-light">{formattedValue(value)} FCFA</div>
                  {/if}
                {/if}
                <div class="text-sm font-italic"></div>
              </div>
            {/if}
          {/each}
        </MarkerLayer>
      </GeoJSON>
    {/if}

    <VectorTileSource
      url="pmtiles://data/municipalites.pmtiles"
      id="municipalites"
      promoteId="ref:COG"
    >
      <JoinedData data={statisticsPerRegion} idCol="id_COMMUNE" sourceLayer="municipalites" />

      <SymbolLayer
        paint={{
          'text-color': '#333',
          'text-opacity': 1,
          'text-halo-color': '#eee',
          'text-halo-width': 0.5,
          'text-halo-blur': 0.5
        }}
        layout={{
          'text-allow-overlap': false,
          'text-field': ['get', 'name'],
          'text-halo-color': '#eee',
          'text-halo-width': 0.5,
          'text-halo-blur': 0.5,
          'text-size': 400
        }}
        sourceLayer="municipalites"
      />
      <FillLayer
        paint={paintProperties}
        manageHoverState
        hoverCursor="pointer"
        sourceLayer="municipalites"
        on:click={handleLayerClickIfNeeded}
      ></FillLayer>

      <LineLayer
        paint={{
          'line-opacity': 0.7,

          // Autres propriétés de style...
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            0.1, // Valeur de largeur de ligne lorsque le zoom est à 0
            13,
            1, // Valeur de largeur de ligne lorsque le zoom est à 10
            20,
            2 // Valeur de largeur de ligne lorsque le zoom est à 15
          ],
          'line-color': 'gray'
        }}
        sourceLayer="municipalites"
      />
    </VectorTileSource>

    {#if showCom}
      <GeoJSON data={geojsonMunicipaliteCentroid} promoteId="ref:COG">
        <JoinedData data={statisticsPerRegion} idCol="id_COMMUNE" />
        <SymbolLayer
          paint={{
            'text-color': '#333',
            'text-opacity': 1,
            'text-halo-color': '#eee',
            'text-halo-width': 0.5,
            'text-halo-blur': 0.5
          }}
          layout={{
            'text-allow-overlap': false,
            'text-field': ['get', 'name'],
            'text-size': {
              stops: [
                [3, 3], // À un niveau de zoom de 3, la taille du texte est de 16
                [20, 54] // À un niveau de zoom de 5, la taille du texte est de 24
              ]
            }
          }}
        ></SymbolLayer>
      </GeoJSON>
    {/if}
  </MapLibre>
{/if}

<!-- 

sudo tippecanoe -o "/Users/tony/Documents/Plateforme urbaine Cameroun/data/division_admin_Ivan/departements.mbtiles" -l departements -z14 -Z0 "/Users/tony/Documents/Plateforme urbaine Cameroun/data/division_admin_Ivan/limites_departements.geojson" --force --no-line-simplification 
 
sudo tippecanoe -o "/Users/tony/Documents/Plateforme urbaine Cameroun/data/division_admin_Ivan/regions.mbtiles" -l regions -z13 -Z0 "/Users/tony/Documents/Plateforme urbaine Cameroun/data/division_admin_Ivan/limite_region.geojson" -f --no-line-simplification 
 
sudo tippecanoe -o "/Users/tony/Documents/Plateforme urbaine Cameroun/data/division_admin_Ivan/municipalites.mbtiles" -l municipalites -z14 -Z0 "/Users/tony/Documents/Plateforme urbaine Cameroun/data/division_admin_Ivan/limite_COMMUNE.geojson" -f --no-line-simplification 
 
"Plateforme urbaine Cameroun/data/pmtiles 2" convert "Plateforme urbaine Cameroun/data/regions.mbtiles"  "Plateforme urbaine Cameroun/data/region.pmtiles"                  
"Plateforme urbaine Cameroun/data/pmtiles 2" convert "Plateforme urbaine Cameroun/data/departements.mbtiles"  "Plateforme urbaine Cameroun/data/departements.pmtiles"                  
"Plateforme urbaine Cameroun/data/pmtiles 2" convert "Plateforme urbaine Cameroun/data/municipalites.mbtiles"  "Plateforme urbaine Cameroun/data/municipalites.pmtiles"                  
-->
