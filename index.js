const map = L.map('map').setView([-22.220341, -49.9482], 10); // Latitude e longitude inicial e nível de zoom
const inpLimiteHistorico   = document.getElementById("inpLimiteHistorico");
const btnConsultaHistorico = document.getElementById("btnHistorico");
const btnLimpar            = document.getElementById("btnLimpar");
const cmbAparelhos         = document.getElementById("cmbAparelhos");
let   routingControl       = null;

/**
 * Configuração do mapa
 */
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

/**
 * API - Consulta Geral de Localizações
 * * Retorna a localizacao mais recente para cada aparelho
 * * Utiliza os dados para atualizar os marcadores no mapa
 */
async function fetchAndAddMarkers() {
    try {
      const response     = await fetch('http://localhost:3000/consulta/');
      const localizacoes = await response.json();

      clearMap();

      localizacoes.forEach(local => {
        let marker = L.marker([local.LATITUDE, local.LONGITUDE]);
        map.addLayer(marker);
        marker.bindPopup("<b>"+local.APARELHO_DESCRICAO+"</b>");
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
}

/**
 * API - Consulta de Aparelhos
 * * Retorna os aparelhos cadastrados no sistema
 * * Preenche o campo do filtro de aparelho com as opções válidas
 */
async function fetchAparelhos() {
  try {
    const response  = await fetch('http://localhost:3000/consulta/aparelhos');
    const aparelhos = await response.json();

    let options = `<option value=""></option>`

    aparelhos.forEach(aparelho => {
      options += ` <option value="${aparelho.ID}">${aparelho.DESCRICAO}</option>`
    });

    cmbAparelhos.innerHTML = options;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

/**
 * API - Consulta de Historico de um Aparelho
 * * Retorna os dados e preenche o mapa de acordo calculando a rota
 */
 async function consultaHistorico() {
  try {
    const response     = await fetch(`http://localhost:3000/consulta/historico/${cmbAparelhos.value}&${inpLimiteHistorico.value}`);
    const localizacoes = await response.json();

    clearMap();

    let waypointsArr = [];
    let markersArr = [];
    localizacoes.forEach(local => {
      waypointsArr.push(L.latLng(local.LATITUDE, local.LONGITUDE))
      markersArr.push({LATITUDE: local.LATITUDE, LONGITUDE: local.LONGITUDE, APARELHO_DESCRICAO: local.APARELHO_DESCRICAO, DATAHORA: local.DATAHORA})
    });

    routingControl = L.Routing.control({
      waypoints: waypointsArr,
      routeWhileDragging: true,
      createMarker: (i) => {
        if(markersArr[i].LATITUDE == waypointsArr[i].lat && markersArr[i].LONGITUDE == waypointsArr[i].lng) {
          let local = markersArr[i]
          const dataHoraFormatada = local.DATAHORA.split("T")[0] + " " + local.DATAHORA.split("T")[1].split(".")[0]
          
          let marker = L.marker([local.LATITUDE, local.LONGITUDE]);
          marker.bindPopup(`<b>${local.APARELHO_DESCRICAO}</b><br><i>${dataHoraFormatada}</i>`);
          return marker;
        } else {
          return L.marker(waypointsArr[i].lat, waypointsArr[i].lng)
        }
      }
    }).addTo(map);

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

/**
 * Limpa as camadas adicionadas ao mapa
 */
function clearMap() {
  // Retira os markers
  map.eachLayer(function (layer) {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  // Retira o routing
  if(routingControl != null) {
    map.removeControl(routingControl);
  }
}

/**
 * Função que realiza o carregamento das informações
 * básicas para funcionamento do painel
 */
function preFetchServerData() {
  fetchAparelhos();
  fetchAndAddMarkers();
}

/**
 * Verifica se é possível habilitar o botão de consulta de histórico
 */
function habilitaConsultaHistorico() {
  btnConsultaHistorico.disabled = (cmbAparelhos.value == "" || inpLimiteHistorico.value.length == 0)
}

/**
 * DOM EventListeners
 */
inpLimiteHistorico.oninput = () => {
  let v = inpLimiteHistorico.value.replace(/\D/gi, "")
  if(v == "") { habilitaConsultaHistorico(); return; }
  if(v > 168) { v = 168 }
  if(!isNaN(v) && v != "") { v = parseInt(v) }

  inpLimiteHistorico.value = v;
  habilitaConsultaHistorico();
}
cmbAparelhos.oninput = () => {habilitaConsultaHistorico();}
btnConsultaHistorico.onclick = () => {consultaHistorico();}
btnLimpar.onclick = () => { 
  cmbAparelhos.value = "";
  inpLimiteHistorico.value = "";
  clearMap();
  habilitaConsultaHistorico();
  fetchAndAddMarkers();
}

// Chama a função para buscar os dados e adicionar marcadores assim que o mapa estiver pronto
preFetchServerData();

/**
 * Realiza a conexão e configuração do Socket
 */
const socket = io('http://localhost:3000');
socket.on('connect', () => {
    console.log('SocketIo Conectado');
});

// * MÉTODO 1 - Botão Atualizar
// document.getElementById("atualizar").addEventListener("click", () => {
//   fetchAndAddMarkers();
// })

// * MÉTODO 2 - Atualizacao por Intervalo
// setInterval(() => {
//   fetchAndAddMarkers();
// }, 10000);

// * MÉTODO 3 - WebSocket
socket.on('novaLocalizacao', (local) => {
    fetchAndAddMarkers();
});
