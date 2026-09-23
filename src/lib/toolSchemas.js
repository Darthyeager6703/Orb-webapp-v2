export const toolSchemas = [
  {
    type: 'function',
    function: {
      name: 'webSearch',
      description: 'Search the web for any information — current events, facts, prices, people, places, how-to questions, anything. Use this proactively whenever a question could benefit from real, current information rather than relying on memory.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'What to search for' } },
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