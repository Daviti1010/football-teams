const urlParams = new URLSearchParams(window.location.search);
const position = urlParams.get('position'); // "cm2", "left-cb", etc.

const footballers = document.querySelector(".footballers");
// const left_wing = document.querySelector(".left-wing");








document.querySelector('.search').addEventListener('keypress', async function (event) {
    if (event.key === 'Enter') {
        const searchValue = event.target.value.trim();
        console.log(searchValue);

        if (searchValue === "") {
            footballers.innerHTML = "";
            return;
        }

        try {    
            const response = await fetch(`/player/${searchValue}`);
            const data = await response.json();

            footballers.innerHTML = "";
            
            console.log(data);

            data.player.forEach(player => {
                if (player.strStatus === 'Active' && player.strSport === 'Soccer' && player.strCutout !== null)  {

                displayFootballers(player);
            }
            });

        } catch (error) {
            console.error(error);
        }
    }
});


function displayFootballers(player) {
    const div = document.createElement("div");
    const img = document.createElement("img");
    const h1 = document.createElement("h1");
    const btn = document.createElement("button");
    const position = document.createElement("h2");

    div.classList.add("player-card");
    div.id = player.idPlayer;

    img.src = player.strCutout;

    h1.textContent = player.strPlayer;
    position.textContent = player.strPosition;

    btn.textContent = 'Add Player';

    let btn_id = `id_${player.strPlayer}`;
    btn_id = btn_id.replaceAll(' ', '_');
    btn.id = btn_id;

       btn.addEventListener("click", async function() {
        // Get position from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const position = urlParams.get('position'); // "cm2", "left-cb", etc.
        
        console.log('Adding player to position:', position);
        
        try {
            const response = await fetch('/add-to-team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: player.idPlayer,
                    player_name: player.strPlayer,
                    player_image: player.strCutout,
                    position: position
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // alert(`${player.strPlayer} added to ${position}!`);
                window.location.href = '/fantasy';
            } else {
                alert('Failed to add player');
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error adding player');
        }
    });

    div.appendChild(h1);
    div.appendChild(img);
    div.appendChild(btn);

    footballers.appendChild(div);

};

