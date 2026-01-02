// Water Effect (Ripple)
(() => {
    const canvas = document.getElementById('water-canvas');

    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height, ripples = [];

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        class Ripple {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.r = 0;
                this.opacity = 0.4;
                // Get color from canvas data extension, default to brand-blue (59, 130, 246)
                this.color = canvas.getAttribute('data-ripple-color') || '59, 130, 246';
            }
            update() {
                this.r += 2.5;
                this.opacity -= 0.005;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${this.color}, ${this.opacity})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            ripples.forEach((r, i) => {
                r.update();
                r.draw();
                if (r.opacity <= 0) ripples.splice(i, 1);
            });
            requestAnimationFrame(animate);
        };
        animate();

        window.addEventListener('mousemove', (e) => {
            if (Math.random() > 0.8) {
                ripples.push(new Ripple(e.clientX, e.clientY));
            }
        });
    }
})();
