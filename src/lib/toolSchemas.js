export const toolSchemas = [
  {
    type: 'function',
    function: {
      name: 'searchWikipedia',
      description: 'Search Wikipedia for factual/encyclopedic information on a topic.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'The search query' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'geocodeLocation',
      description: 'Find coordinates and a map link for a place name (city, address, landmark).',
      parameters: {
        type: 'object',
        properties: { place: { type: 'string', description: 'Name of the place to locate' } },
        required: ['place'],
      },
    },
  },
]