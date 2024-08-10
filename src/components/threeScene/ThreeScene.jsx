import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './ThreeScene.css'; // Asegúrate de crear este archivo CSS

const ThreeScene = () => {
  const mountRef = useRef(null);
  const planetsRef = useRef([]);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    
   // Configuración de la cámara
   const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 10000);
   camera.position.set(0, 50, 200); // Ajusta la posición inicial de la cámara (más cerca)
   cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enableZoom = true; // Permitir zoom
    controls.enableRotate = false; // Deshabilitar rotación con el mouse
    controls.enablePan = false; // Deshabilitar pan
    controls.zoomSpeed = 0.5; // Ajusta la velocidad del zoom
    controlsRef.current = controls;

    const light = new THREE.PointLight(0xffffff, 1, 0);
    light.position.set(0, 0, 0);
    scene.add(light);

    // Cargar texturas
    const textureLoader = new THREE.TextureLoader();
    const textureUrls = {
      mercury: '/textures/2k_mercury.jpg',
      venus: '/textures/2k_venus_surface.jpg',
      earth: '/textures/2k_earth_nightmap.jpg',
      mars: '/textures/2k_mars.jpg',
      jupiter: '/textures/2k_jupiter.jpg',
      saturn: '/textures/2k_saturn.jpg',
      uranus: '/textures/2k_uranus.jpg',
      neptune: '/textures/2k_neptune.jpg',
      sun: '/textures/2k_sun.jpg',
      stars: '/textures/8k_stars.jpg',
    };

    const texturePromises = Object.keys(textureUrls).map(key =>
      new Promise((resolve, reject) => {
        textureLoader.load(
          textureUrls[key],
          texture => resolve({ key, texture }),
          undefined,
          error => reject(error)
        );
      })
    );

    const initializeScene = (textures) => {
      const planetTextures = textures.reduce((acc, { key, texture }) => {
        acc[key] = texture;
        return acc;
      }, {});

      const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
      const sunMaterial = new THREE.MeshBasicMaterial({ map: planetTextures.sun });
      const sun = new THREE.Mesh(sunGeometry, sunMaterial);
      scene.add(sun);

      const galaxyGeometry = new THREE.SphereGeometry(500, 64, 64);
      const galaxyMaterial = new THREE.MeshBasicMaterial({
        map: planetTextures.stars,
        side: THREE.BackSide,
      });
      const galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
      scene.add(galaxy);

      const planetData = [
        { name: 'mercury', size: 1, distance: 10, speed: 0.01 },
        { name: 'venus', size: 1.5, distance: 15, speed: 0.008 },
        { name: 'earth', size: 2, distance: 20, speed: 0.006 },
        { name: 'mars', size: 1.8, distance: 25, speed: 0.005 },
        { name: 'jupiter', size: 4, distance: 35, speed: 0.003 },
        { name: 'saturn', size: 3.5, distance: 45, speed: 0.002 },
        { name: 'uranus', size: 3, distance: 55, speed: 0.001 },
        { name: 'neptune', size: 2.8, distance: 65, speed: 0.0008 },
      ];

      const planets = [];
      planetData.forEach(data => {
        const geometry = new THREE.SphereGeometry(data.size, 64, 64);
        const material = new THREE.MeshBasicMaterial({ map: planetTextures[data.name] });
        const planet = new THREE.Mesh(geometry, material);
        planet.userData = { name: data.name, distance: data.distance, speed: data.speed, angle: Math.random() * Math.PI * 2 };
        scene.add(planet);
        planets.push(planet);

        const points = [];
        for (let i = 0; i <= 64; i++) {
          const angle = (i / 64) * Math.PI * 2;
          points.push(new THREE.Vector3(Math.cos(angle) * data.distance, 0, Math.sin(angle) * data.distance));
        }
        const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const trajectoryMaterial = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 1, gapSize: 0.5 });
        const trajectory = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
        trajectory.computeLineDistances();
        scene.add(trajectory);
      });

      planetsRef.current = planets;

      const animate = () => {
        requestAnimationFrame(animate);

        planets.forEach(planet => {
          planet.userData.angle += planet.userData.speed;
          planet.position.x = Math.cos(planet.userData.angle) * planet.userData.distance;
          planet.position.z = Math.sin(planet.userData.angle) * planet.userData.distance;
        });

        // Rotar la cámara automáticamente alrededor del sistema solar
        const time = Date.now() * 0.0001; // Ajusta la velocidad de rotación
        const radius = 100;
        camera.position.x = radius * Math.sin(time);
        camera.position.z = radius * Math.cos(time);
        camera.lookAt(scene.position);

        controls.update();
        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        mount.removeChild(renderer.domElement);

        renderer.dispose();
        scene.traverse(object => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      };
    };

    Promise.all(texturePromises)
      .then(textures => {
        initializeScene(textures);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading textures:', error);
        setLoading(false);
      });

  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {loading && (
        <div className="preloader">
          <div className="spinner"></div>
          <div className="loading-text">Cargando...<br />Hecho por Moisés Salazar</div>
        </div>
      )}
    </div>
  );
};

export default ThreeScene;
