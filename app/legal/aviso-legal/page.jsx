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

export default function AvisoLegalPage() {
  return (
    <Stack gap="xl">
      <Box>
        <Title order={1} fz={{ base: 24, sm: 30 }} fw={700} c="#373a2e" mb="xs">
          Aviso Legal y Condiciones de Uso
        </Title>
        <Text size="sm" c="#7a7d68">
          Términos de servicio y titularidad legal de la plataforma Nutralab VLC · Conforme a la Ley 34/2002 (LSSI-CE)
        </Text>
      </Box>

      <Divider color="rgba(141, 145, 122, 0.18)" />

      {/* 1. Titularidad */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          1. Titularidad del Sitio y de la Plataforma
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          En cumplimiento del artículo 10 de la <strong>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE)</strong>, se informa de que la plataforma <strong>Nutralab VLC</strong> constituye un entorno de software especializado para la gestión, monitorización y optimización nutricional en el ámbito deportivo de alto rendimiento.
        </Text>
        <Text size="sm" c="#5c6049" lh={1.6}>
          El acceso y uso de esta plataforma está restringido exclusivamente a los deportistas, cuerpo técnico, preparadores físicos y nutricionistas debidamente acreditados y autorizados por la entidad deportiva responsable.
        </Text>
      </Stack>

      {/* 2. Objeto */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          2. Objeto y Condiciones de Acceso
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          Nutralab VLC proporciona herramientas digitales para la asignación de pautas nutricionales personalizadas, registro de ingestas, control de osmolaridad e hidratación, administración de suplementación y seguimiento de la evolución antropométrica.
        </Text>
        <List size="sm" c="#5c6049" spacing="xs" withPadding>
          <List.Item>
            <strong>Carácter personal e intransferible:</strong> Las credenciales de acceso (usuario y contraseña) asignadas a cada técnico o jugador son de uso estrictamente personal. El usuario es el único responsable de su custodia y confidencialidad.
          </List.Item>
          <List.Item>
            <strong>Prohibición de cesión:</strong> Queda terminantemente prohibido ceder, transferir o facilitar el acceso a la plataforma a terceras personas no vinculadas profesionalmente con la organización.
          </List.Item>
          <List.Item>
            <strong>Uso lícito y deportivo:</strong> El usuario se compromete a hacer un uso diligente y de buena fe de la plataforma, absteniéndose de introducir código malicioso o intentar acceder a información no autorizada para su rol.
          </List.Item>
        </List>
      </Stack>

      {/* 3. Propiedad Intelectual */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          3. Propiedad Intelectual e Industrial
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          Todos los derechos de propiedad intelectual e industrial sobre el software de Nutralab VLC, su diseño gráfico, código fuente, interfaz visual, hojas de estilos, bases de datos nutricionales, recetas, planes dietéticos y logotipos son titularidad exclusiva de sus legítimos propietarios o de la entidad que ostente las licencias de explotación correspondientes.
        </Text>
        <Text size="sm" c="#5c6049" lh={1.6}>
          Queda expresamente prohibida la reproducción, distribución, transformación, ingeniería inversa o comunicación pública de cualquier elemento de la plataforma sin la previa autorización expresa y por escrito de los titulares.
        </Text>
      </Stack>

      {/* 4. Responsabilidad y Criterio Nutricional */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          4. Responsabilidad y Supervisión Profesional
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          Las pautas, menús y recomendaciones de suplementación reflejadas en Nutralab VLC son elaboradas y supervisadas por el área técnica de nutrición y rendimiento deportivo. La plataforma actúa como herramienta de gestión y comunicación; el seguimiento real y cualquier contingencia médica o dietética de los jugadores debe ser canalizada a través de los profesionales de la salud del equipo.
        </Text>
      </Stack>

      {/* 5. Legislación y Jurisdicción */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          5. Legislación Aplicable y Fuero
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          Las presentes condiciones se rigen por la legislación española vigente. Para cualquier controversia o litigio derivado de la utilización del portal, las partes se someten a los juzgados y tribunales competentes conforme a la normativa procesal aplicable.
        </Text>
      </Stack>

      {/* Resumen institucional */}
      <Paper p="md" radius="lg" bg="rgba(92, 96, 73, 0.06)" style={{ border: '1px solid rgba(141, 145, 122, 0.2)' }}>
        <Text size="xs" c="#5c6049" lh={1.6}>
          La utilización continuada de la plataforma Nutralab VLC por parte de jugadores y técnicos implica la aceptación plena de las presentes condiciones de uso y de las políticas de privacidad y cookies asociadas.
        </Text>
      </Paper>
    </Stack>
  );
}
