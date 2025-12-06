// Reglas de detección IDS
const rules = {
  sqlInjection: {
    patterns: ["'", '"', '--', '1=1', 'OR', 'or', 'UNION', 'union', 'SELECT', 'select'],
    severity: 'high',
    tipo: 'SQL Injection'
  },
  
  xss: {
    patterns: ['<script', 'javascript:', 'onerror=', 'onload=', 'alert('],
    severity: 'high',
    tipo: 'XSS'
  },
  
  pathTraversal: {
    patterns: ['../', '../', '/etc/passwd', 'C:\\Windows'],
    severity: 'medium',
    tipo: 'Path Traversal'
  },
  
  commandInjection: {
    patterns: [';', '|', '&&', '`', '$('],
    severity: 'critical',
    tipo: 'Command Injection'
  },
  
  honeypotPaths: ['/admin', '/phpMyAdmin', '/wp-admin', '/.env', '/.git'],
  
  suspiciousUserAgents: ['sqlmap', 'nikto', 'nmap', 'burp', 'metasploit']
};

module.exports = rules;
