import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeAvatarProps {
  color?: string;
  isTalking?: boolean;
}

export const ThreeAvatar: React.FC<ThreeAvatarProps> = ({ color = '#32bcad', isTalking = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Cena, Câmera e Renderizador Three.js
    const width = 320;
    const height = 320;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Luzes Neon
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(color, 2, 50);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // Grupo do Personagem Robô / Mascote TangPix
    const characterGroup = new THREE.Group();

    // Cabeça (Icosaedro Metálico)
    const headGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.2,
      wireframe: false
    });
    const head = new THREE.Mesh(headGeo, headMat);
    characterGroup.add(head);

    // Olhos Neon Brilhantes
    const eyeGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: color });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.4, 0.2, 1.0);
    characterGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.4, 0.2, 1.0);
    characterGroup.add(rightEye);

    // Anel Orbital Giratório em Torno do Avatar
    const ringGeo = new THREE.TorusGeometry(1.8, 0.05, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.9,
      roughness: 0.1,
      emissive: color,
      emissiveIntensity: 0.4
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    characterGroup.add(ring);

    scene.add(characterGroup);

    // Loop de Animação
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Flutuação suave (levitação)
      characterGroup.position.y = Math.sin(elapsedTime * 2.5) * 0.15;
      characterGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.3;

      // Anel gira continuamente
      ring.rotation.z += 0.02;
      ring.rotation.y += 0.01;

      // Se estiver falando, os olhos pulsam e a cabeça balança no ritmo
      if (isTalking) {
        const talkPulse = 1 + Math.sin(elapsedTime * 15) * 0.2;
        leftEye.scale.set(talkPulse, talkPulse, talkPulse);
        rightEye.scale.set(talkPulse, talkPulse, talkPulse);
        head.rotation.x = Math.sin(elapsedTime * 8) * 0.08;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [color, isTalking]);

  return <div ref={mountRef} className="w-[320px] h-[320px] flex items-center justify-center pointer-events-none" />;
};
