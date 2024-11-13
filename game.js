const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const lastScoreElement = document.getElementById('lastScore');

const balloonImages = ['assets/balloon1.png', 'assets/balloon2.png', 'assets/balloon3.png'];
const bulletImage = new Image();
bulletImage.src = 'assets/bullet.png';
const jetImage = new Image();
jetImage.src = 'assets/jet.png';
const backgroundImage = new Image();
backgroundImage.src = 'assets/playing-background.png';

let balloon, bullets, jet, gameInterval, bulletInterval, scoreInterval, balloonIndex;
let score = 0;
let lastScore = 0;
const keys = {};

const acceleration = 0.4; // Further increased acceleration for faster balloon
const friction = 0.05;
const returnSpeed = 0.05; // Speed at which the balloon returns to its original position

function init() {
    balloonIndex = Math.floor(Math.random() * balloonImages.length);
    const balloonImage = new Image();
    balloonImage.src = balloonImages[balloonIndex];
    balloonImage.onload = () => {
        balloon = {
            image: balloonImage,
            width: 75, // Adjusted width to make it bigger
            height: 80, // Adjusted height to maintain aspect ratio
            x: canvas.width / 2 - 37.5,
            y: canvas.height - 200, // Moved up
            vx: 0, // Velocity in x direction
            vy: 0, // Velocity in y direction
            angle: 0, // Current rotation angle
            visible: true // Visibility flag for balloon
        };
        drawBalloon();
    };

    jet = {
        image: jetImage,
        width: 80, // leave it like this
        height: 70, // leave it like this
        x: canvas.width / 2 - 50,
        y: -50, // Start outside the top of the canvas
        vx: 0, // Velocity in x direction
        vy: 0, // Velocity in y direction
        angle: 0, // Current rotation angle
        visible: true // Visibility flag for jet
    };
}

function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

function drawBalloon() {
    if (balloon.visible) {
        ctx.save();
        ctx.translate(balloon.x + balloon.width / 2, balloon.y + balloon.height / 2);
        ctx.rotate(balloon.angle);
        ctx.drawImage(balloon.image, -balloon.width / 2, -balloon.height / 2, balloon.width, balloon.height);
        ctx.restore();
    }
}

function drawJet() {
    if (jet.visible) {
        ctx.save();
        ctx.translate(jet.x + jet.width / 2, jet.y + jet.height / 2);
        ctx.rotate(jet.angle);
        ctx.drawImage(jet.image, -jet.width / 2, -jet.height / 2, jet.width, jet.height);
        ctx.restore();
    }
}

function drawScore() {
    ctx.save();
    ctx.font = '36px MazinDEMO-Bold';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 6; // Thicker outline
    ctx.strokeStyle = 'black';
    ctx.strokeText(score, canvas.width / 2, 30); // Lowered position
    ctx.fillText(score, canvas.width / 2, 30); // Lowered position
    ctx.restore();
}

function startGame() {
    menu.classList.add('hidden'); // Smoothly hide the menu
    setTimeout(() => {
        menu.style.display = 'none';
        bullets = [];
        score = 0;

        gameInterval = setInterval(updateGame, 20);
        bulletInterval = setInterval(spawnBullet, 900); // Spawn a bullet every second
        scoreInterval = setInterval(() => {
            score += 1;
        }, 1000); // Increase score every second
    }, 500); // Match the transition duration
}

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the background
    drawBackground();

    if (balloon.visible) {
        // Apply acceleration based on keys pressed
        if (keys['KeyW']) balloon.vy -= acceleration;
        if (keys['KeyS']) balloon.vy += acceleration;
        if (keys['KeyA']) balloon.vx -= acceleration;
        if (keys['KeyD']) balloon.vx += acceleration;

        // Apply friction
        balloon.vx *= (1 - friction);
        balloon.vy *= (1 - friction);

        // Update balloon position
        balloon.x += balloon.vx;
        balloon.y += balloon.vy;

        // Calculate target rotation angle based on velocity
        let targetAngle = 0;
        if (keys['KeyD']) {
            targetAngle = 0.2; // Tilt more to the right
        } else if (keys['KeyA']) {
            targetAngle = -0.2; // Tilt more to the left
        } else {
            targetAngle = Math.atan2(balloon.vy, balloon.vx) * 0.1; // General tilt based on velocity
        }

        // Smoothly animate back to original position when movement ends
        if (!keys['KeyW'] && !keys['KeyS'] && !keys['KeyA'] && !keys['KeyD']) {
            targetAngle = 0;
        }

        // Smoothly interpolate the current angle towards the target angle
        balloon.angle += (targetAngle - balloon.angle) * returnSpeed;

        // Draw balloon with rotation
        drawBalloon();
    }

    // Update jet position to track the balloon
    if (jet.visible) {
        const dx = balloon.x - jet.x;
        const dy = balloon.y - jet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 3; // Adjust speed for smooth movement
        jet.vx = (dx / distance) * speed;
        jet.vy = (dy / distance) * speed;
        jet.x += jet.vx;
        jet.y += jet.vy;

        // Calculate jet rotation angle based on velocity
        jet.angle = Math.atan2(jet.vy, jet.vx);

        // Draw jet with rotation
        drawJet();
    }

    // Update and draw bullets
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Remove bullets that are out of the canvas
        if (bullet.x < -bullet.width || bullet.x > canvas.width || bullet.y < -bullet.height || bullet.y > canvas.height) {
            bullets.splice(index, 1);
        } else {
            // Calculate rotation angle based on velocity
            const angle = Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2; // Adjust angle to point upwards

            // Draw bullet with rotation
            ctx.save();
            ctx.translate(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
            ctx.rotate(angle);
            ctx.drawImage(bulletImage, -bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height);
            ctx.restore();
        }
    });

    // Draw the score
    drawScore();

    // Check for collisions
    checkCollisions();
}

function spawnBullet() {
    const bullet = {
        x: Math.random() * canvas.width, // Random x position at the bottom
        y: canvas.height, // Start just outside the bottom of the canvas
        width: 20, // Increased size
        height: 40, // Increased size
        vx: (Math.random() - 0.5) * 4, // Random x velocity
        vy: -4 // Constant y velocity upwards
    };
    bullets.push(bullet);
}

function resetGame() {
    clearInterval(gameInterval);
    clearInterval(bulletInterval);
    clearInterval(scoreInterval);

    // Hide balloon and jet
    balloon.visible = false;
    jet.visible = false;

    // Stop bullets
    bullets = [];

    // Move jet out of the frame
    jet.vx = 0;
    jet.vy = -5; // Move upwards
    jet.y = -jet.height;

    // Update last score
    lastScore = score;
    lastScoreElement.textContent = `Last Score: ${lastScore}`;

    // Fade out the game elements
    canvas.style.transition = 'opacity 0.5s ease';
    canvas.style.opacity = 0;

    setTimeout(() => {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Show menu instantly
        menu.style.display = 'block';
        menu.classList.remove('hidden'); // Ensure menu is visible
        canvas.style.opacity = 1; // Reset canvas opacity
        init(); // Reinitialize the game
    }, 500); // Match the transition duration
}

function checkCollisions() {
    // Check collision between balloon and bullets
    bullets.forEach((bullet) => {
        if (
            bullet.x < balloon.x + balloon.width &&
            bullet.x + bullet.width > balloon.x &&
            bullet.y < balloon.y + balloon.height &&
            bullet.y + bullet.height > balloon.y
        ) {
            resetGame();
        }
    });

    // Check collision between balloon and jet with smaller hitbox
    const jetHitbox = {
        x: jet.x + 20, // Adjust hitbox position
        y: jet.y + 20, // Adjust hitbox position
        width: jet.width - 40, // Adjust hitbox size
        height: jet.height - 40 // Adjust hitbox size
    };
    if (
        jetHitbox.x < balloon.x + balloon.width &&
        jetHitbox.x + jetHitbox.width > balloon.x &&
        jetHitbox.y < balloon.y + balloon.height &&
        jetHitbox.y + jetHitbox.height > balloon.y
    ) {
        resetGame();
    }

    // Check collision between balloon and frame with a bit of tolerance
    const frameTolerance = 10; // Allow some tolerance before game over
    if (
        balloon.x < -frameTolerance ||
        balloon.x + balloon.width > canvas.width + frameTolerance ||
        balloon.y < -frameTolerance ||
        balloon.y + balloon.height > canvas.height + frameTolerance
    ) {
        resetGame();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        startGame();
    }
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Initialize the game
init();