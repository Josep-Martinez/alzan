import { PredefinedTemplate } from '../types/training';
export { PredefinedTemplate };

export const PREDEFINED_TEMPLATES: PredefinedTemplate[] = [
  // 1) Full Body A
  {
    id: 'full-body-a',
    name: 'Full Body A',
    description:
      'Sesión de fuerza base enfocada en los grandes movimientos compuestos: Sentadilla, Press Banca y Peso Muerto.',
    days_per_week: 1,
    exercises: [
      {
        exercise_id: 'e92b3390-fd1e-4683-89f4-3ff3c6538e4e',
        target_sets: 3,
        target_reps_min: 6,
        target_reps_max: 10,
        rest_seconds: 120,
      },
      {
        exercise_id: 'cf3b38a4-f312-4354-96f9-9a6bc21df0d0',
        target_sets: 3,
        target_reps_min: 6,
        target_reps_max: 10,
        rest_seconds: 120,
      },
      {
        exercise_id: 'eb376635-4a4b-4a0e-b60f-d6455cd9e928',
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 90,
      },
      {
        exercise_id: 'f1c377e7-b87d-4b97-b502-433c6f93593f',
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 120,
      },
      {
        exercise_id: '5ee16458-a4df-4fe3-938b-79e9ae01d949',
        target_sets: 2,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 90,
      },
      {
        exercise_id: '2393be28-bed0-4705-b5f4-654681651ca8',
        target_sets: 2,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 60,
      },
      {
        exercise_id: 'db3eb616-db89-4cf1-9abf-8586580b4084',
        target_sets: 2,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 60,
      },
    ],
  },
  // 2) Full Body B
  {
    id: 'full-body-b',
    name: 'Full Body B',
    description:
      'Sesión complementaria con énfasis en tracción vertical y hombros, ideal para equilibrar el desarrollo muscular.',
    days_per_week: 1,
    exercises: [
      {
        exercise_id: 'f1c377e7-b87d-4b97-b502-433c6f93593f',
        target_sets: 3,
        target_reps_min: 6,
        target_reps_max: 10,
        rest_seconds: 120,
      },
      {
        exercise_id: 'c607c999-17e2-42e3-9afa-ff1f06a66d24',
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 90,
      },
      {
        exercise_id: 'ac5b65d8-cebb-4f84-9a2f-e0170069de2d',
        target_sets: 3,
        target_reps_min: 6,
        target_reps_max: 10,
        rest_seconds: 120,
      },
      {
        exercise_id: 'f4f08874-1e91-44ad-83a0-a7b809aaf34c',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 120,
      },
      {
        exercise_id: '24571e7f-85c9-491f-8703-e003a4aec53d',
        target_sets: 2,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 90,
      },
      {
        exercise_id: '9eba3286-c1c2-4058-83f2-bbce205f702f',
        target_sets: 2,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 75,
      },
      {
        exercise_id: '52b89ce8-bd74-4736-ad41-1f29732fb3a4',
        target_sets: 2,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 90,
      },
    ],
  },
  // 3) Push
  {
    id: 'push',
    name: 'Push (Empuje)',
    description: 'Enfoque en pecho, hombros y tríceps.',
    days_per_week: 1,
    exercises: [
      {
        exercise_id: 'cf3b38a4-f312-4354-96f9-9a6bc21df0d0',
        target_sets: 4,
        target_reps_min: 6,
        target_reps_max: 10,
        rest_seconds: 120,
      },
      {
        exercise_id: '5ee16458-a4df-4fe3-938b-79e9ae01d949',
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 90,
      },
      {
        exercise_id: 'd945a5f3-2c23-4c75-b3f1-796b4d77bf5d',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 75,
      },
      {
        exercise_id: '4ba76616-1df9-41ca-a9c3-ac00b1009be5',
        target_sets: 2,
        target_reps_min: 6,
        target_reps_max: 12,
        rest_seconds: 90,
      }, // Fondos en paralelas
      {
        exercise_id: 'db3eb616-db89-4cf1-9abf-8586580b4084',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 60,
      },
    ],
  },
  // 4) Pull
  {
    id: 'pull',
    name: 'Pull (Tracción)',
    description: 'Enfoque en espalda, bíceps y deltoides posterior.',
    days_per_week: 1,
    exercises: [
      {
        exercise_id: '6cd16910-0305-4a2a-9d36-0681daa4df4b',
        target_sets: 3,
        target_reps_min: 6,
        target_reps_max: 10,
        rest_seconds: 120,
      },
      {
        exercise_id: 'eb376635-4a4b-4a0e-b60f-d6455cd9e928',
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 90,
      },
      {
        exercise_id: '475f9ba5-f3b0-4450-a921-d27a1ab6e3c2',
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 90,
      }, // Jalón agarre ancho
      {
        exercise_id: '4cbbab21-5699-4fb9-ac58-05efda2824d6',
        target_sets: 3,
        target_reps_min: 12,
        target_reps_max: 20,
        rest_seconds: 60,
      }, // Face Pull rope
      {
        exercise_id: 'bd698c53-cc9d-40bc-bac6-b9fcf6ffb4a8',
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 90,
      },
      {
        exercise_id: '2393be28-bed0-4705-b5f4-654681651ca8',
        target_sets: 2,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 60,
      },
    ],
  },
  // 5) Torso
  {
    id: 'torso',
    name: 'Torso',
    description: 'Entrenamiento completo del tren superior.',
    days_per_week: 1,
    exercises: [
      {
        exercise_id: 'cf3b38a4-f312-4354-96f9-9a6bc21df0d0',
        target_sets: 3,
        target_reps_min: 6,
        target_reps_max: 10,
        rest_seconds: 120,
      },
      {
        exercise_id: 'eb376635-4a4b-4a0e-b60f-d6455cd9e928',
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 90,
      },
      {
        exercise_id: 'ac5b65d8-cebb-4f84-9a2f-e0170069de2d',
        target_sets: 3,
        target_reps_min: 6,
        target_reps_max: 10,
        rest_seconds: 120,
      },
      {
        exercise_id: 'c607c999-17e2-42e3-9afa-ff1f06a66d24',
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 90,
      },
      {
        exercise_id: '31126017-f194-4999-9fc4-d3cdab15ab84',
        target_sets: 2,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 75,
      },
      {
        exercise_id: '93d593fe-5f88-48ab-98e1-7984b1aa5573',
        target_sets: 2,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 60,
      }, // Curl cable
      {
        exercise_id: 'db3eb616-db89-4cf1-9abf-8586580b4084',
        target_sets: 2,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 60,
      },
    ],
  },
  // 6) Pierna
  {
    id: 'legs',
    name: 'Pierna',
    description: 'Entrenamiento de alta intensidad enfocado en la ganancia de fuerza pura en el tren inferior.',
    days_per_week: 1,
    exercises: [
      {
        exercise_id: 'e92b3390-fd1e-4683-89f4-3ff3c6538e4e',
        target_sets: 4,
        target_reps_min: 6,
        target_reps_max: 10,
        rest_seconds: 150,
      },
      {
        exercise_id: 'f4f08874-1e91-44ad-83a0-a7b809aaf34c',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 120,
      },
      {
        exercise_id: '52b89ce8-bd74-4736-ad41-1f29732fb3a4',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 90,
      },
      {
        exercise_id: 'ad3dcb00-27cd-4808-9504-9222d0afade2',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 90,
      }, // Ext cuads
      {
        exercise_id: 'cbd83948-95b2-48dc-ade3-90d2642b5f69',
        target_sets: 4,
        target_reps_min: 10,
        target_reps_max: 20,
        rest_seconds: 75,
      }, // Gemelos
      {
        exercise_id: '05eda6ce-65ea-47b0-b6c9-1aeb35bbc2b7',
        target_sets: 2,
        target_reps_min: 12,
        target_reps_max: 20,
        rest_seconds: 60,
      },
    ],
  },
  // 7) Pierna + Glúteo
  {
    id: 'legs-glute',
    name: 'Glúteos + Estética',
    description: 'Rutina especializada para el desarrollo de glúteos y moldeado estético del tren inferior.',
    days_per_week: 1,
    exercises: [
      {
        exercise_id: '81085ac1-f964-42bf-874f-5f13b9cd4383',
        target_sets: 4,
        target_reps_min: 6,
        target_reps_max: 12,
        rest_seconds: 120,
      }, // Hip thrust barra
      {
        exercise_id: 'f1c377e7-b87d-4b97-b502-433c6f93593f',
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 120,
      },
      {
        exercise_id: 'e4596505-5dce-4fe8-8ef3-049ad1c3a9b0',
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 90,
        notes: 'Por lado',
      }, // Sentadilla bulgara
      {
        exercise_id: '52b89ce8-bd74-4736-ad41-1f29732fb3a4',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 15,
        rest_seconds: 90,
      },
      {
        exercise_id: '05eda6ce-65ea-47b0-b6c9-1aeb35bbc2b7',
        target_sets: 3,
        target_reps_min: 12,
        target_reps_max: 20,
        rest_seconds: 60,
      },
      {
        exercise_id: '388d28b2-b73a-432b-84fc-51c62d3b8c89',
        target_sets: 2,
        target_reps_min: 12,
        target_reps_max: 20,
        rest_seconds: 60,
        notes: 'Por lado',
      }, // Patada gluteo polea
    ],
  },
];
