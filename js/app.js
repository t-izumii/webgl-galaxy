// import * as THREE from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import fragmentShader from './fragmentShader.glsl';
import vertexShader from './vertexShader.glsl';


class app3 {
    constructor() {
        this.container = document.querySelector('#webgl');
        this.scene = new THREE.Scene();
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.sceneBg = new THREE.Scene();
        this.mouse = new THREE.Vector2(0.5, 0.5);
        this.time = 0;
        this.isPlay = true;
        this.parameters = {};
        this.parameters.count = 500000;
        this.parameters.size = 0.005;
        this.parameters.raddius = 5;
        this.parameters.branches = 8;
        this.parameters.spin = 1;
        this.parameters.randomness = 0.3;
        this.parameters.randomnessPower = 3;
        this.parameters.insideColor = '#ff9373';
        this.parameters.outsideColor = '#1b3984';

        this.geometry = null;
        this.material = null;
        this.points = null;

        this.init();

    }

    init() {
        this.mousePosition();
        this.createCamera();
        this.createRenderer();
        this.createMesh();
        this.render();
        this.setupGUI();
    }

    get viewport(){
        let width = window.innerWidth;
        let height = window.innerHeight;
        let aspectRatio = width / height;

        return{
            width,
            height,
            aspectRatio
        }
    }

    mousePosition() {
            window.addEventListener('mousemove', (event) => {
            this.mouse.x = event.clientX - this.viewport.width / 2;
            this.mouse.y = this.viewport.height / 2 - event.clientY;
        });
    }

    createCamera() {
        let fov = 75;
        this.camera = new THREE.PerspectiveCamera(fov, this.viewport.aspectRatio, 1, 1000);
        this.camera.position.x = 6;
        this.camera.position.z = 6;
        this.camera.position.y = 2;
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setClearColor(0x000000);
        this.renderer.setSize(this.viewport.width, this.viewport.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    }
    createMesh() {
        if (this.points !== null) {
            console.log(this.points);
            this.geometry.dispose();
            this.material.dispose();
            this.scene.remove(this.points);
        }

        this.geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.parameters.count * 3);
        const colors = new Float32Array(this.parameters.count * 3);
        const scales = new Float32Array(this.parameters.count * 1);
        const randomness = new Float32Array(this.parameters.count * 3);

        const colorInside = new THREE.Color(this.parameters.insideColor);
        const colorOutside = new THREE.Color(this.parameters.outsideColor);


        for (let i = 0; i < this.parameters.count; i++) {
            const i3 = i * 3;

            const raddius = this.parameters.raddius * Math.random();
            const branchAngle = (i % this.parameters.branches) / this.parameters.branches * Math.PI * 2;


            positions[i3] = Math.cos(branchAngle) * raddius;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = Math.sin(branchAngle) * raddius;

            const randomX = Math.pow(Math.random(), this.parameters.randomnessPower) * (Math.random() > 0.5 ? 1 : -1) * this.parameters.randomness * raddius;
            const randomY = Math.pow(Math.random(), this.parameters.randomnessPower) * (Math.random() > 0.5 ? 1 : -1) * this.parameters.randomness * raddius;
            const randomZ = Math.pow(Math.random(), this.parameters.randomnessPower) * (Math.random() > 0.5 ? 1 : -1) * this.parameters.randomness * raddius;

            randomness[i3] = randomX;
            randomness[i3 + 1] = randomY;
            randomness[i3 + 2] = randomZ;

            const mixedColor = colorInside.clone();
            mixedColor.lerp(colorOutside, raddius / this.parameters.raddius);

            colors[i3 + 0] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;

            scales[i] = Math.random();
        }

        this.geometry.setAttribute(
            'position', new THREE.BufferAttribute(positions,3)
        )

        this.geometry.setAttribute(
            'color', new THREE.BufferAttribute(colors,3)
        )
        this.geometry.setAttribute(
            'aScale', new THREE.BufferAttribute(scales,1)
        )
        this.geometry.setAttribute(
            'aRandomness', new THREE.BufferAttribute(randomness,3)
        )

        this.material = new THREE.ShaderMaterial({
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                uTime: { value: 50.0 },
                uSize: { value: 30.0 * window.devicePixelRatio },
            }
        });


        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);
    }

    stop() {
        this.isPlay = false;
    }

    start() {
        if(!this.isPlay){
            this.isPlay = true;
            this.render();
        }
    }

    render() {
        if (!this.isPlay) {
            return;
        }
        this.time += 0.01;
        this.material.uniforms.uTime.value += 0.01;
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this));
    }

    setupGUI() {
        const gui = new dat.GUI();
        gui.add(this.parameters, 'count').min(100).max(1000000).step(100).onChange(() => this.createMesh());
        gui.add(this.material.uniforms.uSize, 'value').min(1).max(100).step(1).name('size').onChange(() => {
            this.createMesh();
        });
        gui.add(this.parameters, 'raddius').min(0.01).max(20).step(0.01).onChange(() => this.createMesh());
        gui.add(this.parameters, 'branches').min(2).max(20).step(1).onChange(() => this.createMesh());
        gui.add(this.parameters, 'randomness').min(0).max(2).step(0.001).onChange(() => this.createMesh());
        gui.add(this.parameters, 'randomnessPower').min(1).max(10).step(1).onChange(() => this.createMesh());
        gui.addColor(this.parameters, 'insideColor').onChange(() => this.createMesh());
        gui.addColor(this.parameters, 'outsideColor').onChange(() => this.createMesh());
    }

    lerp(a, b, n) {
        return (1 - n) * a + n * b;
    }

}

new app3();
