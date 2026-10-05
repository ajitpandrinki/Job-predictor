export const ROLES = [
  {
    id: 'frontend-developer',
    label: 'Frontend Developer',
    skills: ['HTML & CSS', 'JavaScript', 'React', 'Responsive Design', 'Git'],
    resources: {
      'HTML & CSS': 'Practice accessible layouts and modern CSS with a small responsive page.',
      JavaScript: 'Build a project using async JavaScript, array methods, and browser APIs.',
      React: 'Create a React app using components, hooks, forms, and API data.',
      'Responsive Design': 'Make a project work smoothly across mobile, tablet, and desktop.',
      Git: 'Practice branches, pull requests, and clear commit messages in a project repository.',
    },
  },
  {
    id: 'backend-developer',
    label: 'Backend Developer',
    skills: ['Node.js', 'REST APIs', 'Databases', 'Authentication', 'Git'],
    resources: {
      'Node.js': 'Build a small service with clear modules, error handling, and input validation.',
      'REST APIs': 'Design and document a REST API with consistent status codes and pagination.',
      Databases: 'Model related data and practice indexes, queries, and schema validation.',
      Authentication: 'Learn secure password storage, access tokens, and authorization checks.',
      Git: 'Practice branches, pull requests, and clear commit messages in a project repository.',
    },
  },
  {
    id: 'full-stack-developer',
    label: 'Full-stack Developer',
    skills: ['JavaScript', 'React', 'Node.js', 'Databases', 'REST APIs', 'Git'],
    resources: {
      JavaScript: 'Build a project using async JavaScript, array methods, and browser APIs.',
      React: 'Create a React app using components, hooks, forms, and API data.',
      'Node.js': 'Build a small service with clear modules, error handling, and input validation.',
      Databases: 'Model related data and practice indexes, queries, and schema validation.',
      'REST APIs': 'Design and document a REST API with consistent status codes and pagination.',
      Git: 'Practice branches, pull requests, and clear commit messages in a project repository.',
    },
  },
  {
    id: 'data-analyst',
    label: 'Data Analyst',
    skills: ['SQL', 'Python', 'Data Visualization', 'Statistics', 'Spreadsheets'],
    resources: {
      SQL: 'Practice joins, aggregations, and window functions against a public dataset.',
      Python: 'Explore a dataset with Python and explain your cleaning and analysis steps.',
      'Data Visualization': 'Build a clear dashboard that answers a specific business question.',
      Statistics: 'Review descriptive statistics, sampling, and common hypothesis tests.',
      Spreadsheets: 'Practice formulas, pivot tables, and data cleaning on a real dataset.',
    },
  },
  {
    id: 'software-engineer',
    label: 'Software Engineer',
    skills: ['Data Structures', 'Algorithms', 'JavaScript', 'Testing', 'Git'],
    resources: {
      'Data Structures': 'Implement core data structures and explain their trade-offs.',
      Algorithms: 'Practice problem solving and discuss time and space complexity.',
      JavaScript: 'Build a project using async JavaScript, array methods, and browser APIs.',
      Testing: 'Add unit and integration tests for important paths in an existing project.',
      Git: 'Practice branches, pull requests, and clear commit messages in a project repository.',
    },
  },
]

export function getRole(roleId) {
  return ROLES.find((role) => role.id === roleId) || ROLES[0]
}
