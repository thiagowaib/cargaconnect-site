const map = L.map('map').setView([-22.220341, -49.9482], 10); // Latitude e longitude inicial e nível de zoom

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    
    // Função para consultar a API e adicionar marcadores no mapa
    async function fetchAndAddMarkers() {
        try {
          const response = await fetch('http://localhost:3000/consulta/'); // Endpoint da sua API
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

    // Chama a função para buscar os dados e adicionar marcadores assim que o mapa estiver pronto
    fetchAndAddMarkers();

    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
        console.log('SocketIo Conectado');
    });
    
    socket.on('novaLocalizacao', (local) => {
        fetchAndAddMarkers();
    });
    