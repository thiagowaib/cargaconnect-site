const map = L.map('map').setView([-22.220341, -49.9482], 10); // Latitude e longitude inicial e nível de zoom
const inpLimiteHistorico   = document.getElementById("inpLimiteHistorico");
const btnConsultaHistorico = document.getElementById("btnHistorico");
const btnLimpar            = document.getElementById("btnLimpar");
const cmbAparelhos         = [document.getElementById("cmbAparelhos1"), document.getElementById("cmbAparelhos2")];
const spanStatus           = document.getElementById("statusSpan");
const inpDataRotas         = document.getElementById("inpDataRotas");
const btnDataRotas         = document.getElementById("btnDataRotas");
const containerDatas       = document.getElementById("container-datas");
const btnRotas             = document.getElementById("btnRotas");
const btnLimparRotas       = document.getElementById("btnLimparRotas");
const grdRotas             = document.getElementById("grdRotas");
let   routingControl       = null;
let   datasArray           = [];
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

      spanStatus.innerHTML="Modo da Consulta: <b>Geral</b>";
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

    cmbAparelhos[0].innerHTML = options;
    cmbAparelhos[1].innerHTML = options;
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
    const response     = await fetch(`http://localhost:3000/consulta/historico/${cmbAparelhos[0].value}&${inpLimiteHistorico.value}`);
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

    spanStatus.innerHTML="Modo da Consulta: <b>Histórico</b>";

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
  btnConsultaHistorico.disabled = (cmbAparelhos[0].value == "" || inpLimiteHistorico.value.length == 0)
}

function habilitaConsultaRotas() {
  btnRotas.disabled = (cmbAparelhos[1].value == "" || datasArray.length <= 0)
}

function removerData(data) {
  if(datasArray.includes(data) && inpDataRotas.disabled == false) {
    datasArray = datasArray.filter(d => d != data);
    console.log({datasArray})
    containerDatas.innerHTML = "";
    datasArray.forEach(d => {
      containerDatas.innerHTML += `<p id='data-${d}'>${formataData(d)}<span onclick=\"removerData('${v}')\">✖</span></p>`;
    })
  }
  habilitaConsultaRotas();
}

function formataData(vData) {
  v = vData.replace(/\D/gi, "");
  if(v.length == 8)
    return v[0]+v[1]+"/"+v[2]+v[3]+"/"+v[4]+v[5]+v[6]+v[7];
  else
    return vData;
}

function formataDataDB(vData) {
  v = vData.replace(/\D/gi, "");
  if(v.length == 8)
    return v[6]+v[7]+"/"+v[4]+v[5]+"/"+v[0]+v[1]+v[2]+v[3];
  else
    return vData;
}

function formataDataQuery(vData) {
  v = vData.replace(/\D/gi, "");
  if(v.length == 8)
    return v[4]+v[5]+v[6]+v[7]+"-"+v[2]+v[3]+"-"+v[0]+v[1];
  else
    return vData;
}

function formataDistancia(vDist) {
  let vDist1 = vDist.toString().split(".")[0]
  let vDist2 = vDist.toString().split(".")[1]
  let vDist1F = vDist1;

  vDist1F = "";
  for(let i=(vDist1.length-1), j = 1; i>=0; i--, j++) {
    if((j)%3==0 && i!=0) {vDist1F = "."+vDist1[i]+vDist1F}
    else {vDist1F = vDist1[i] + vDist1F}
  }
  

  return vDist1F + "," + vDist2[0] + vDist2[1] + " Km"
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
inpDataRotas.oninput = () => {
  let v = inpDataRotas.value.replace(/\D/gi, "");
  if(v.length >= 8) {
    let va = formataData(v);
    inpDataRotas.value = va;
  } else {
    inpDataRotas.value = v;
  }
}
cmbAparelhos[0].oninput = () => {habilitaConsultaHistorico();}
cmbAparelhos[1].oninput = () => {habilitaConsultaRotas();}
btnConsultaHistorico.onclick = () => {consultaHistorico();}
btnLimpar.onclick = () => { 
  cmbAparelhos[0].value = "";
  inpLimiteHistorico.value = "";
  clearMap();
  habilitaConsultaHistorico();
  fetchAndAddMarkers();
}
btnDataRotas.onclick = () => {
  let v = inpDataRotas.value.replace(/\D/gi, "");
  if(v.length == 8 && !datasArray.includes(v)) {
    datasArray.push(v);
    containerDatas.innerHTML += `<p id='data-${v}'>${formataData(v)}<span onclick=\"removerData('${v}')\">✖</span></p>`;
    inpDataRotas.value = "";
  }
  habilitaConsultaRotas();
}
btnLimparRotas.onclick = () => {
  cmbAparelhos[1].value = "";
  datasArray = [];
  containerDatas.innerHTML = "";
  inpDataRotas.value = "";
  grdRotas.innerHTML = "<tr><th>Data</th><th>Distância Percorrida</th></tr><tr><td>-</td><td>-</td></tr>";
  inpDataRotas.disabled = false;
  cmbAparelhos[1].disabled = false;
  habilitaConsultaRotas();
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


// Realiza a requisição GraphQL
btnRotas.onclick = () => {

  let datas = []
  datas = datasArray.map(d => {return '"'+formataDataQuery(d)+'"'})
  let aparelhoid = cmbAparelhos[1].value;

  if(datas.length <= 0 || aparelhoid.trim().length <= 0) { return; }

  // Define a query GraphQL
  const query = `
  query {
    consultarDistancias(aparelhoId: "${aparelhoid}", datas: [${datas}]) {
      ID
      DISTANCIA
      APARELHO_ID
      DATA
    }
  }
  `;
// Define as opções da requisição
  fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  .then(response => response.json())
  .then(data => {

    grdRotas.innerHTML = "<tr><th>Data</th><th>Distância Percorrida</th></tr>";
    if(data && data.data && data.data.consultarDistancias && data.data.consultarDistancias.length > 0) {
      data.data.consultarDistancias.forEach(obj => {
        console.log(obj)
        grdRotas.innerHTML += `<tr><td>${formataDataDB(obj.DATA)}</td><td>${formataDistancia(obj.DISTANCIA)}</td></tr>`;
      });
      inpDataRotas.disabled = true;
      cmbAparelhos[1].disabled = true;
    } else {
      grdRotas.innerHTML += "<tr><td>-</td><td>-</td></tr>";
    }
    
  })
  .catch(error => {
    console.error('Erro na requisição GraphQL:', error);
  });
}