const map = L.map('map').setView([-22.220341, -49.9482], 10); // Latitude e longitude inicial e nível de zoom
const inpLimiteHistorico   = document.getElementById("inpLimiteHistorico");
const btnConsultaHistorico = document.getElementById("btnHistorico");
const cmbAparelhos         = document.getElementById("cmbAparelhos");

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Função para consultar a API e adicionar marcadores no mapa
async function fetchAndAddMarkers() {
    try {
      const response     = await fetch('http://localhost:3000/consulta/');
      const localizacoes = await response.json();

      map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
      });

      localizacoes.forEach(local => {
        console.log({local})
        let marker = L.marker([local.LATITUDE, local.LONGITUDE]);
        map.addLayer(marker);
        marker.bindPopup("<b>"+local.APARELHO_DESCRICAO+"</b>");
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
}

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

function preFetchServerData() {
  fetchAparelhos();
  fetchAndAddMarkers();
}

function habilitaConsultaHistorico() {
  btnConsultaHistorico.disabled = (cmbAparelhos.value == "" || inpLimiteHistorico.value.length == 0)
}

inpLimiteHistorico.oninput = () => {
  let v = inpLimiteHistorico.value.replace(/\D/gi, "")
  if(v == "") { habilitaConsultaHistorico(); return; }
  if(v > 168) { v = 168 }
  if(!isNaN(v) && v != "") { v = parseInt(v) }

  inpLimiteHistorico.value = v;
  habilitaConsultaHistorico();
}

cmbAparelhos.oninput = () => {
  habilitaConsultaHistorico();
}

// Chama a função para buscar os dados e adicionar marcadores assim que o mapa estiver pronto
preFetchServerData();

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
