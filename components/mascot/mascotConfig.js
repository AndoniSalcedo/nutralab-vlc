/**
 * Configuración de animaciones de la Mascota Nutralab.
 * Estructurada limpiamente por carpetas de estado (/mascot/frames/<estado>/).
 */

export const MASCOT_ANIMATIONS = {
  idle: {
    name: 'idle',
    label: 'Listo para ayudar',
    message: '¡Hola! Soy Nutra, estoy aquí para acompañarte 🥑',
    // Secuencia completa de respiración orgánica y balanceo continuo:
    // Ida: 1 -> 1.5 -> 2 -> 2.5 -> 3 -> 3.5 -> 4 -> 4.5
    // Retorno simétrico: 4.5f -> 4f -> 3.5f -> 3f -> 2.5f -> 2f -> 1.5f -> 1f
    frames: [
      '/mascot/frames/idle/frame_1.png',
      '/mascot/frames/idle/frame_1_5.png',
      '/mascot/frames/idle/frame_2.png',
      '/mascot/frames/idle/frame_2_5.png',
      '/mascot/frames/idle/frame_3.png',
      '/mascot/frames/idle/frame_3_5.png',
      '/mascot/frames/idle/frame_4.png',
      '/mascot/frames/idle/frame_4_5.png',
      '/mascot/frames/idle/frame_4_5_flipped.png',
      '/mascot/frames/idle/frame_4_flipped.png',
      '/mascot/frames/idle/frame_3_5_flipped.png',
      '/mascot/frames/idle/frame_3_flipped.png',
      '/mascot/frames/idle/frame_2_5_flipped.png',
      '/mascot/frames/idle/frame_2_flipped.png',
      '/mascot/frames/idle/frame_1_5_flipped.png',
      '/mascot/frames/idle/frame_1_flipped.png',
    ],
    frameDurations: [
      400, 450, 400, 450, 400, 450, 400, 450,
      400, 450, 400, 450, 400, 450, 400, 450,
    ],
    loop: false,
    pingPong: false,
  },
  focus_email: {
    name: 'focus_email',
    label: 'Siguiendo tu escritura...',
    message: 'Mirando tu correo...',
    // Alternancia suave de lado a lado: empieza en flipped (lado contrario) y pasa al original
    frames: [
      '/mascot/frames/focus_email/frame_1_flipped.png',
      '/mascot/frames/focus_email/frame_2_flipped.png',
      '/mascot/frames/focus_email/frame_3_flipped.png',
      '/mascot/frames/focus_email/frame_4_flipped.png',
      '/mascot/frames/focus_email/frame_3_flipped.png',
      '/mascot/frames/focus_email/frame_2_flipped.png',
      '/mascot/frames/focus_email/frame_1.png',
      '/mascot/frames/focus_email/frame_2.png',
      '/mascot/frames/focus_email/frame_3.png',
      '/mascot/frames/focus_email/frame_4.png',
      '/mascot/frames/focus_email/frame_3.png',
      '/mascot/frames/focus_email/frame_2.png',
    ],
    frameDurations: [
      400, // f1_flipped centro
      400, // f2_flipped inclina hacia el lado contrario
      400, // f3_flipped observa
      400, // f4_flipped sostiene mirada
      400, // f3_flipped regresa
      400, // f2_flipped vuelve al centro
      400, // f1 centro
      400, // f2 inclina hacia el lado original
      400, // f3 observa
      400, // f4 sostiene mirada
      400, // f3 regresa
      400, // f2 vuelve al centro
    ],
    loop: true,
    pingPong: false,
  },
  typing: {
    name: 'typing',
    label: 'Escribiendo...',
    message: 'Escribiendo...',
    // Secuencia completa de 12 fotogramas (03_typing, 3.5 y 3.6 unificados e intercalados fluidamente)
    frames: [
      '/mascot/frames/typing/frame_1.png',
      '/mascot/frames/typing/frame_2.png',
      '/mascot/frames/typing/frame_3.png',
      '/mascot/frames/typing/frame_4.png',
      '/mascot/frames/typing/frame_5.png',
      '/mascot/frames/typing/frame_6.png',
      '/mascot/frames/typing/frame_7.png',
      '/mascot/frames/typing/frame_8.png',
      '/mascot/frames/typing/frame_9.png',
      '/mascot/frames/typing/frame_10.png',
    ],
    frameDurations: [350, 350, 350, 350, 350, 350, 350, 350, 350, 350],
    loop: true,
    pingPong: false,
  },
  password: {
    name: 'password',
    label: 'Privacidad protegida',
    message: 'No miro tu contraseña 🙈',
    // Secuencia de taparse los ojos:
    // Los primeros 8 fotogramas (0..7: subir manos y mejillas) solo se ejecutan una vez como intro.
    // El bucle continuo (8..15): 9 -> 10 -> 11 -> 12 -> 12f -> 11f -> 10f -> 9f (la última normal conecta con la primera del flip).
    frames: [
      '/mascot/frames/password/frame_1.png',  // 0: intro sube manos
      '/mascot/frames/password/frame_2.png',  // 1
      '/mascot/frames/password/frame_3.png',  // 2
      '/mascot/frames/password/frame_4.png',  // 3: intro manos a mejillas
      '/mascot/frames/password/frame_5.png',  // 4
      '/mascot/frames/password/frame_6.png',  // 5
      '/mascot/frames/password/frame_7.png',  // 6: intro llega a ojos
      '/mascot/frames/password/frame_8.png',  // 7
      // --- BUCLE (la última normal es la primera del flip) ---
      '/mascot/frames/password/frame_9.png',         // 8: BUCLE - cubre ojos
      '/mascot/frames/password/frame_10.png',        // 9: abre deditos
      '/mascot/frames/password/frame_11.png',        // 10: espía
      '/mascot/frames/password/frame_12.png',        // 11: espía sostenido
      '/mascot/frames/password/frame_12_flipped.png',// 12: primera del flip (espía lado contrario)
      '/mascot/frames/password/frame_11_flipped.png',// 13: espía lado contrario
      '/mascot/frames/password/frame_10_flipped.png',// 14: cierra deditos lado contrario
      '/mascot/frames/password/frame_9_flipped.png', // 15: cubierto lado contrario
    ],
    frameDurations: [
      300, 300, 300, // 0..2 intro sube manos
      300, 300, 300, // 3..5 intro mejillas
      300, 300,      // 6..7 intro llega a ojos
      // Bucle: 9 -> 10 -> 11 -> 12 -> 12f -> 11f -> 10f -> 9f
      500,           // 8: cubre ojos
      500,           // 9: abre deditos
      500,           // 10: espía
      500,           // 11: espía sostenido
      500,           // 12: primera del flip (espía lado contrario)
      500,           // 13: espía lado contrario
      500,           // 14: cierra deditos
      500,           // 15: cubierto lado contrario
    ],
    loop: true,
    loopStartIndex: 8, // Los 8 primeros fotogramas se ejecutan solo 1 vez; el bucle repite desde el índice 8
    pingPong: true,
  },
  loading: {
    name: 'loading',
    label: 'Validando acceso...',
    message: 'Comprobando acceso...',
    frames: [
      '/mascot/frames/loading/frame_1.png',
      '/mascot/frames/loading/frame_2.png',
      '/mascot/frames/loading/frame_3.png',
      '/mascot/frames/loading/frame_4.png',
    ],
    frameDurations: [600, 600, 600, 600],
    loop: true,
    pingPong: true,
  },
  success: {
    name: 'success',
    label: '¡Acceso correcto!',
    message: '¡Bienvenido!',
    frames: [
      '/mascot/frames/success/frame_1.png',
      '/mascot/frames/success/frame_2.png',
      '/mascot/frames/success/frame_3.png',
      '/mascot/frames/success/frame_4.png',
    ],
    frameDurations: [350, 350, 450, 400],
    loop: true,
    pingPong: false,
  },
  confused: {
    name: 'confused',
    label: '¿Algo salió mal?',
    message: '¿Algo salió mal?',
    frames: [
      '/mascot/frames/confused/frame_1.png',
      '/mascot/frames/confused/frame_2.png',
      '/mascot/frames/confused/frame_3.png',
      '/mascot/frames/confused/frame_4.png',
    ],
    frameDurations: [650, 650, 700, 650],
    loop: true,
    pingPong: true,
  },
  embarrassed: {
    name: 'embarrassed',
    label: 'Contraseña incorrecta',
    message: 'Contraseña incorrecta...',
    frames: [
      '/mascot/frames/embarrassed/frame_1.png',
      '/mascot/frames/embarrassed/frame_2.png',
      '/mascot/frames/embarrassed/frame_3.png',
      '/mascot/frames/embarrassed/frame_4.png',
    ],
    frameDurations: [600, 600, 650, 600],
    loop: true,
    pingPong: true,
  },
};

export const MASCOT_TRANSITIONS = {
  // Mapa preparado para frames intermedios de transición entre estados
};

export function getAllMascotFrameUrls() {
  const urls = new Set();
  Object.values(MASCOT_ANIMATIONS).forEach((anim) => {
    anim.frames.forEach((f) => urls.add(f));
  });
  Object.values(MASCOT_TRANSITIONS).forEach((transList) => {
    transList.forEach((f) => urls.add(f));
  });
  return Array.from(urls);
}
