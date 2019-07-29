/**
 * Function: debug
 * @return: Wraps console functions so that they can be used without worrying about breaking browsers
 */
var DEBUG_MODE = true;

function debug() {
    if (DEBUG_MODE && window.console) {
        console.info(arguments);
    }
} // End of debug()

const MX = {
    /**
     * @function init
     * @purpose to initialize the application
     */
    init: function () {
        debug('Memorax.init ');

        // Game variables
        MX.pair = 0;
        MX.pair = [];
        MX.seconds = 0;
        MX.score = 100;
        MX.turnsPlayed = 0;
        MX.playable = false;
        MX.intervalId = 0
        MX.flippedCards = [];

        // Dom Elements
        MX.game = $('.game-table');
        MX.gamePad = $('.game-pad');
        MX.pairs = $('#pairs');
        MX.turns = $('#turns');
        MX.scores = $('#score');
        MX.timer = $('#time');

        // fetch game cards 
        $.ajax({
            url: "/js/data.json",
            success: function (result, status, xhr) {
                // 1. Set the number of pairs
                MX.pair = result.length;
                // 2. Render deck of cards
                MX.renderDeck(result);
                // 3. Update Info UI
                MX.updateInfo();
            }
        });

        // Clear gamePad contents and interval
        MX.gamePad.empty();
    },

    /**
     * @function renderDeck
     * @purpose to render the deck of playable cards into the DOM
     *
     * @param cards an Array list of card objects
     */
    renderDeck: function (cards) {
        // 1. Duplicate the cards to create a deck of pairs
        MX.deck = cards.concat(cards);

        // 2. Shuffle deck
        MX.deck = MX.shuffleCards(MX.deck);

        // 3. Create each card element
        MX.deck.forEach(card => {
            MX.createCard(card);
        });
    },

    /**
     * @function createCard
     * @purpose to create the markup element of a playable card
     *
     * @param card {object}  A card object with id and name
     */
    createCard: function (card) {
        // 1. create a new div element
        let div = $('<div></div>');

        // 2. Add the card's class and html markup
        div.addClass('card-container').html(
            `<div class="card" data-id="${card.id}">
                <svg class="logo">
                    <use xlink:href="img/sprite.svg#icon-${card.name}"></use>
                </svg>
            </div>`
        );

        // 3. Append element to the UI gamePad
        MX.gamePad.append(div);
    },

    /**
     * @function showGameOverModal
     * @purpose to display the game over modal in the DOM
     */
    showGameOverModal: function () {
        // 1. create a new div element
        let div = $('<div></div>');

        // 2. Add the card's class and html markup
        div.addClass('scoreCard').html(
            `<div class="field">
                <h2>Well Done!</h2>
                <h2>Final Score: ${MX.finalScore()}</h2>
                <div class="checkout-btn init">
                    <a href="#memorax" class="checkout-btn_link init" >
                    <span class="checkout-btn_text init">Play again</span>
                    </a>
                </div>
            </div>`
        );

        // 3. Append element to the UI gamePad
        MX.gamePad.append(div);
    },

    /**
     * @function shuffleCards
     * @purpose to shuffle the deck of cards using the Fisher--Yates Algorithm
     *
     * @param deck a set of pair cards
     */
    shuffleCards: function (deck) {
        var len = deck.length,
            card, indx;
        while (len) {
            indx = Math.floor(Math.random() * len--);
            // And swap it with the current element.
            card = deck[len];
            deck[len] = deck[indx];
            deck[indx] = card;
        }
        return deck;
    },

    /**
     * @function flipCard
     * @purpose to process a single flip of a card
     *
     * @param target | The jquery card element to process
     */
    flipCard: function (target) {
        debug("MX: flipCard, ", target)
        // 1. Add card target to the list
        MX.flippedCards.push(target);

        // 2. Update card state
        target.addClass("face-up");

    },

    /**
     * @function turnOver
     * @purpose to return the selected cards face down if a match was not found
     */
    turnOver: function () {
        // update UI
        MX.flippedCards[0].removeClass("face-up");
        MX.flippedCards[1].removeClass("face-up");

        // 2. Update score
        MX.score -= 5;
    },

    /**
     * @function turnOver
     * @purpose to return 2 flipped cards face down when a match is not found
     */
    matchFound: function () {
        // 1. Update cards state
        MX.flippedCards[0].addClass("match");
        MX.flippedCards[1].addClass("match");

        // 2. Update score
        MX.score += 30;

        // 3. Update pairs left
        MX.pair -= 1;
    },

    /**
     * @function validateMatch
     * @purpose to validate if a flipped pair is a match or not
     */
    validateMatch: function () {
        if (MX.flippedCards[0].attr("data-id") !== MX.flippedCards[1].attr("data-id")) {
            // 1. If cards do not match return to face down position
            setTimeout(() => MX.turnOver(), 500);
        } else {
            //2. Else update the card state
            MX.matchFound();
        }

        //Update Game variables
        MX.playable = false;

        setTimeout(() => {
            MX.turnsPlayed += 1;
            MX.flippedCards = [];
            MX.playable = true;

            // 3. Update UI
            MX.updateInfo();
        }, 600);
    },

    /**
     * @function gameOver
     * @purpose to set the animation for the return the selected cards face down
     *
     */
    gameOver: function () {
        setTimeout(() => MX.showGameOverModal(), 1000);

        for (let index = 0, len = MX.gamePad.children().length; index < len; index++) {
            let card = MX.gamePad.children().eq(index).children().first();
            card.addClass("finished");
            window.clearInterval(MX.intervalId - index);
        }
    },

    /**
     * @function updateInfo
     * @purpose Update the info UI in the DOM
     *
     */
    updateInfo: function () {
        MX.turns.text(MX.format00(MX.turnsPlayed));
        MX.pairs.text(MX.format00(MX.pair));
        MX.scores.text(MX.score);
        if (MX.seconds === 0)
            MX.timer.text("00:00");
    },
    /**
     * @function startTime
     * @purpose to start counter of seconds and update the time info in the UI
     */
    startTime: function () {
        debug("MX.startTime, ")
        MX.intervalId = setInterval(function () {
            // 1. Increase seconds by 1
            MX.seconds += 1
            // 2.  Update timer text
            MX.timer.text(`${MX.format00(parseInt(MX.seconds / 60))} : ${MX.format00(MX.seconds % 60)}`);
        }, 1000);
        MX.playable = true;
    },

    /**
     * @function finalScore
     * @purpose to calculate the final score when game is over
     */
    finalScore: function () {
        MX.score = (MX.score * 1.5) - ((MX.turnsPlayed - (MX.deck.length / 2)) * 4) - ((MX.seconds - (MX.deck.length)) * 1);
        return parseInt(MX.score);
    },

    /**
     * @function toggleGlobalNavigation
     * @purpose toggle the mainDropdown of the globalNav
     *
     * @param child | A node element to traverse
     */
    format00: function format00(value) {
        return ((value + "").length < 2) ? "0" + value : value;
    }
} // end of MX()

/**
 * Window Load
 */
$(document).ready(function () {
    // 1. Initiate game on load
    MX.init();

    // 2. Add event listener to DOM
    $(this).click(function (event) {
        // 1. get jquery element
        let target = $(event.target)

        // 2. Set new game
        if (target.hasClass("init")) {
            return setTimeout(() => MX.init(), 100);
        }

        // 1 Start timer only at 1st flip
        if (MX.playable === false && MX.seconds === 0) {
            MX.startTime();
        }

        /** GAME LOGIC */
        if (MX.playable && target.hasClass("card") && !target.hasClass("face-up")) {


            // 2. Flip up to 2 cards
            if (MX.flippedCards.length <= 1 && !target.is(MX.flippedCards[0])) {
                MX.flipCard(target);
            }

            // 3. When 2 cards are flipped validate
            if (MX.flippedCards.length == 2) {
                MX.validateMatch();
            }

            // 4. If there are no more pairs left the game is over
            if (MX.pair <= 0) {
                MX.gameOver();
            }
        }
    })
});