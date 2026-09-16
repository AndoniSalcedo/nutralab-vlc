'use client';

import {
  Box,
  Divider,
  List,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';

export default function PrivacidadPage() {
  return (
    <Stack gap="xl">
      <Box>
        <Title order={1} fz={{ base: 24, sm: 30 }} fw={700} c="#373a2e" mb="xs">
          Política de Privacidad y Protección de Datos
        </Title>
        <Text size="sm" c="#7a7d68">
          En cumplimiento del Reglamento General de Protección de Datos (RGPD UE 2016/679) y la Ley Orgánica 3/2018 (LOPDGDD)
        </Text>
      </Box>

      <Divider color="rgba(141, 145, 122, 0.18)" />

      {/* 1. Responsable */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          1. Responsable del Tratamiento
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          El responsable del tratamiento de los datos recabados y procesados a través de la plataforma <strong>Nutralab VLC</strong> es la entidad deportiva u organización responsable de la gestión médica y nutricional de los futbolistas y el cuerpo técnico. Para cualquier consulta o ejercicio de derechos en materia de protección de datos, puedes dirigirte al departamento de nutrición o a través del canal oficial de privacidad habilitado por el club.
        </Text>
      </Stack>

      {/* 2. Finalidad del tratamiento */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          2. Finalidad del Tratamiento de Datos
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          Los datos personales tratados en esta plataforma se destinan exclusivamente a las siguientes finalidades profesionales:
        </Text>
        <List size="sm" c="#5c6049" spacing="xs" withPadding>
          <List.Item>
            <strong>Planificación y monitorización nutricional:</strong> Elaboración de menús personalizados, pautas dietéticas de entrenamiento y partido, control de ingestas y suplementación deportiva.
          </List.Item>
          <List.Item>
            <strong>Seguimiento de la composición corporal y salud:</strong> Registro de parámetros antropométricos (peso, pliegues, masa magra, grasa), hidratación/osmolaridad y analíticas biológicas pertinentes para optimizar el rendimiento y prevenir lesiones.
          </List.Item>
          <List.Item>
            <strong>Gestión de acceso y seguridad:</strong> Control de credenciales de técnicos, nutricionistas y jugadores, garantizando que cada usuario acceda únicamente a los datos autorizados según su rol.
          </List.Item>
        </List>
      </Stack>

      {/* 3. Categorías especiales de datos (Salud) */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          3. Tratamiento de Categorías Especiales de Datos (Datos de Salud)
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          La información nutricional, analíticas y métricas antropométricas constituyen categorías especiales de datos conforme al <strong>Artículo 9 del RGPD</strong>. Dicho tratamiento se fundamenta en:
        </Text>
        <List size="sm" c="#5c6049" spacing="xs" withPadding>
          <List.Item>
            El <strong>consentimiento explícito e informado</strong> del deportista (Art. 9.2.a RGPD).
          </List.Item>
          <List.Item>
            La ejecución de la relación deportiva/contractual y la medicina preventiva, diagnóstico y gestión de la salud y rendimiento deportivo bajo la supervisión de profesionales de la salud y nutrición deportiva cualificados (Art. 9.2.h RGPD).
          </List.Item>
        </List>
      </Stack>

      {/* 4. Confidencialidad y Destinatarios */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          4. Confidencialidad y Destinatarios
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          Todos los miembros del equipo nutricional, médico y técnico autorizados para acceder a Nutralab VLC están sujetos a un estricto deber de confidencialidad y secreto profesional.
        </Text>
        <Text size="sm" c="#5c6049" lh={1.6}>
          <strong>Bajo ninguna circunstancia</strong> los datos serán cedidos, transferidos, comercializados o comunicados a terceros ajenos a la entidad deportiva, salvo obligación legal expresa o requerimiento judicial aplicable.
        </Text>
      </Stack>

      {/* 5. Conservación */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          5. Plazo de Conservación
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          Los datos personales y registros de salud se conservarán durante la vigencia de la vinculación deportiva del jugador o técnico con la entidad, y con posterioridad durante los plazos legalmente exigibles para la atención de posibles responsabilidades derivadas del tratamiento o de la legislación sanitaria y deportiva aplicable.
        </Text>
      </Stack>

      {/* 6. Derechos del Interesado */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          6. Derechos del Usuario (ARCO-POL)
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          Cualquier usuario de la plataforma puede ejercer en cualquier momento sus derechos reconocidos por el RGPD:
        </Text>
        <List size="sm" c="#5c6049" spacing="xs" withPadding>
          <List.Item><strong>Derecho de Acceso:</strong> Conocer qué datos personales están siendo tratados.</List.Item>
          <List.Item><strong>Derecho de Rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos.</List.Item>
          <List.Item><strong>Derecho de Supresión:</strong> Solicitar la eliminación de sus datos cuando ya no sean necesarios.</List.Item>
          <List.Item><strong>Derecho de Oposición y Limitación:</strong> Oponerse al tratamiento o solicitar la limitación del mismo en los casos previstos por la ley.</List.Item>
          <List.Item><strong>Derecho a la Portabilidad:</strong> Obtener una copia de sus datos en formato estructurado e interoperable.</List.Item>
        </List>
        <Text size="sm" c="#5c6049" lh={1.6} mt="xs">
          Asimismo, el usuario tiene derecho a presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong> a través de su sede electrónica (<Text component="span" fw={600}>www.aepd.es</Text>) si considera que se ha vulnerado la normativa vigente en el tratamiento de sus datos personales.
        </Text>
      </Stack>

      {/* 7. Medidas de Seguridad */}
      <Paper p="md" radius="lg" bg="rgba(92, 96, 73, 0.06)" style={{ border: '1px solid rgba(141, 145, 122, 0.2)' }}>
        <Stack gap="xs">
          <Text size="sm" fw={700} c="#373a2e">
            Seguridad Técnica y Organizativa
          </Text>
          <Text size="xs" c="#5c6049" lh={1.6}>
            Nutralab VLC aplica medidas de cifrado en tránsito (HTTPS/TLS), almacenamiento seguro de credenciales con hashing de contraseñas, sesiones protegidas mediante cookies HTTP-Only y partición de permisos por rol para salvaguardar la integridad y privacidad de la información deportiva y médica.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
