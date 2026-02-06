
const right_winger = document.querySelector(".right-wing");
const left_winger = document.querySelector(".left-wing");
const forward = document.querySelector(".forward");
const cm1 = document.querySelector(".cm1")
const cm2 = document.querySelector(".cm2")
const cm3 = document.querySelector(".cm3")
const left_cb = document.querySelector(".left-cb");
const right_cb = document.querySelector(".right-cb");
const left_back = document.querySelector(".left-back");
const right_back = document.querySelector(".right-back");
const goalkeeper = document.querySelector(".goalkeeper");
const add_button = document.querySelectorAll(".add-btn");

document.addEventListener("DOMContentLoaded", function() {
    setup_add_buttons();
    load_team();
});

// ---------------------------------------------------------

function setup_add_buttons() {
    document.querySelectorAll('.add-btn').forEach(button => {
        button.addEventListener('click', function () {

            const parent = button.closest(".player-card");

            const position = parent.classList[1];

            // console.log(position);
            window.location.href = `/search/?position=${position}`;
        });
    });
}

// ---------------------------------------------------------


async function load_team() {
    try {
        const response = await fetch("/api-info");
        const players = await response.json();

        console.log('Loaded players:', players);
        
        // Display each player
        players.forEach(player => {
            display_player(player);
        });

    } catch (error) {
        console.error("Error loading team:", error);
    }
}


function display_player(player) {

    let player_position = player.position;

    // working for goalkeeper + centre-forward
    const positionCard = document.querySelector(`.player-card.${player_position.toLowerCase()}`);

    // console.log(player_position);

        if (!positionCard) {
            console.error('Position not found:', player.position);
            return;
        }

        // Create player image
        const img = document.createElement("img");
        img.src = player.player_image;
        img.classList.add('player-img');

        // Add to position card
        positionCard.appendChild(img);

        buttons(positionCard, player);

}


function buttons(positionCard, player) {
    // Toggle buttons - hide add, show remove
    const addBtn = positionCard.querySelector('.add-btn');
    const removeBtn = positionCard.querySelector('.remove-btn');
    
    if (addBtn) addBtn.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'block';

    removeBtn.addEventListener("click", async function() {
        // if (confirm(`Do you want to delete ${player.player_name}?`)) {
        try {
            const response = await fetch(`/remove-player/${player.position}`, {
                method: 'DELETE'
            });

            const data = await response.json();
        
             if (data.success) {
                    const img = positionCard.querySelector('.player-img');
                    if (img) img.remove();
                    
                    removeBtn.style.display = 'none';
                    if (addBtn) addBtn.style.display = 'block';
                    
                    console.log(`Removed ${player.player_name} from ${player.position}`);
                } else {
                    alert('Failed to delete player');
                }

        } catch (error) {
            console.error('Error:', error);
        }
    // }
    });
    
    console.log(`Displayed ${player.player_name} at ${player.position}`);
}