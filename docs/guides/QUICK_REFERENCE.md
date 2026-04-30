# 🚀 SDLC Agent System - Quick Reference Guide

**Version**: 1.0.0
**Last Updated**: 2026-04-30

---

## 📋 Quick Start

### Run Full Pipeline
```bash
node agents/orchestrator.js
```

### Run Selective Agents
```bash
node agents/orchestrator.js --agents=security,test,critic
```

### Run Individual Agents
```bash
node agents/security-agent.js
node agents/test-agent.js
node agents/coverage-agent.js
node agents/critic-agent.js
node agents/readme-agent.js
node agents/perf-agent.js
node agents/quality-agent.js
node agents/dev-agent.js
```

---

## 🤖 Agent Overview

| Agent | Purpose | Critical | Execution Time |
|-------|---------|----------|----------------|
| **security** | Security analysis | ✅ Yes | ~2-4 min |
| **dev** | Code implementation | ✅ Yes | ~2-5 min |
| **quality** | Code quality | ⚠️ No | ~1-2 min |
| **test** | Test suite | ✅ Yes | ~3-8 min |
| **coverage** | Coverage analysis | ⚠️ No | ~1-2 min |
| **perf** | Performance analysis | ⚠️ No | ~2-5 min |
| **critic** | Code review | ⚠️ No | ~1-3 min |
| **readme** | Documentation | ⚠️ No | ~1-2 min |

---

## 🔄 Pipeline Flows

### New Feature
```
dev → test → coverage → security → critic → readme
```

### Bug Fix
```
dev → test → coverage → security → critic
```

### Hotfix
```
dev → test → security → critic
```

### Refactoring
```
dev → test → coverage → critic → readme
```

---

## 📊 Quality Gates

### Development Agent
- ✅ Code compiles successfully
- ✅ No linting errors
- ✅ Follows coding standards
- ✅ Includes error handling
- ✅ Maintains API contracts

### Testing Agent
- ✅ All tests pass
- ✅ New tests added for changes
- ✅ No flaky tests
- ✅ Coverage maintained
- ✅ Tests use in-memory MongoDB

### Coverage Agent
- ✅ Coverage meets thresholds (65% lines, 30% branches)
- ✅ Critical paths covered
- ✅ No significant regression
- ✅ Report generated

### Security Agent
- ✅ No critical vulnerabilities
- ✅ Security best practices followed
- ✅ Dependencies are secure
- ✅ Required middleware present

### Critic Agent
- ✅ Code quality standards met
- ✅ No anti-patterns introduced
- ✅ Proper documentation included
- ✅ Architectural consistency maintained

### Documentation Agent
- ✅ Documentation updated
- ✅ API docs current
- ✅ Examples provided
- ✅ README updated

### Performance Agent
- ✅ No obvious performance regressions
- ✅ Database queries optimized
- ✅ API responses within limits
- ✅ No memory leaks

### Quality Agent
- ✅ No linting errors
- ✅ Code formatted correctly
- ✅ Style standards met
- ✅ Complexity within limits

---

## 🛡️ Security Requirements

### Required Middleware
- ✅ helmet
- ✅ cors
- ✅ express-rate-limit
- ✅ express-mongo-sanitize
- ✅ xss-clean
- ✅ compression

### JWT Cookie Requirements
- ✅ httpOnly: true
- ✅ secure: true (production)
- ✅ sameSite: strict

### Secret Patterns
- ❌ sk_live_[A-Za-z0-9]{20,}
- ❌ AKIA[0-9A-Z]{16}
- ❌ AIza[0-9A-Za-z\\-_]{35}

---

## 📈 Coverage Thresholds

```javascript
{
  "statements": 65,
  "branches": 30,
  "functions": 40,
  "lines": 65
}
```

---

## 🚨 Critical Issues

### Must Fix Immediately
1. **Missing Database Indexes** - Performance bottleneck
2. **N+1 Query Pattern** - Performance degradation
3. **Missing Error Handling** - Unhandled failures
4. **Inconsistent Null Checks** - Potential 500 errors

### Should Fix Soon
5. **Missing Input Validation** - Invalid data
6. **Race Condition in Stock Update** - Data inconsistency
7. **Missing Transaction Support** - Inconsistent state
8. **Inefficient Product Listing Query** - Slow queries

---

## 📝 Code Quality Standards

### Forbidden Patterns
- ❌ forEach(async) - swallows errors
- ❌ console.log in production
- ❌ var declarations
- ❌ eval() usage
- ❌ hardcoded ports

### Required Patterns
- ✅ try-catch for async operations
- ✅ null checks after findById
- ✅ const/let instead of var
- ✅ proper error handling
- ✅ environment variables for config

### HTTP Status Codes
- GET → 200
- POST → 201
- PUT → 200
- DELETE → 200

---

## 🔧 Configuration Files

### Agent Configuration
- `agents/orchestrator.js` - Pipeline coordinator
- `agents/security-agent.js` - Security analysis
- `agents/test-agent.js` - Test suite
- `agents/coverage-agent.js` - Coverage analysis
- `agents/critic-agent.js` - Code review
- `agents/readme-agent.js` - Documentation
- `agents/perf-agent.js` - Performance analysis
- `agents/quality-agent.js` - Code quality
- `agents/dev-agent.js` - Code implementation

### Project Configuration
- `package.json` - Dependencies and scripts
- `eslint.config.js` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `playwright.config.js` - E2E test configuration

---

## 📊 Metrics

### Code Quality
- Test Coverage: 65% (Target: 80%)
- Code Complexity: Medium (Target: Low)
- Technical Debt: Medium (Target: Low)
- Documentation: 60% (Target: 80%)

### Performance
- API Response Time (p50): 150ms (Target: 100ms)
- API Response Time (p95): 500ms (Target: 300ms)
- Database Query Time: 50ms (Target: 20ms)
- Page Load Time: 2s (Target: 1.5s)

### Security
- Critical Vulnerabilities: 0 ✅
- High Vulnerabilities: 0 ✅
- Security Headers: 100% ✅
- Dependency Updates: Current ✅

---

## 🎯 Success Criteria

### Code Quality
- [ ] Test coverage ≥ 80%
- [ ] No critical bugs
- [ ] Code complexity ≤ 10
- [ ] Documentation coverage ≥ 80%

### Performance
- [ ] API response time (p50) ≤ 100ms
- [ ] API response time (p95) ≤ 300ms
- [ ] Database query time ≤ 20ms
- [ ] Page load time ≤ 1.5s

### Security
- [ ] Zero critical vulnerabilities
- [ ] All security headers implemented
- [ ] All dependencies up to date
- [ ] Rate limiting on all endpoints

### Reliability
- [ ] 99.9% uptime
- [ ] Zero data loss incidents
- [ ] Automated backups
- [ ] Disaster recovery plan

---

## 📚 Documentation

### Key Documents
- `AGENTIC_SDLC_SYSTEM.md` - Complete system documentation
- `CODEBASE_ANALYSIS_REPORT.md` - Codebase analysis
- `SDLC_IMPLEMENTATION_ROADMAP.md` - Implementation roadmap
- `AGENT_SPECIFICATIONS.md` - Agent specifications
- `README.md` - Project overview

### API Documentation
- Auth Endpoints - `/api/v1/login`, `/api/v1/register`, `/api/v1/logout`
- Product Endpoints - `/api/v1/products`, `/api/v1/product/:id`
- Order Endpoints - `/api/v1/order/new`, `/api/v1/orders/me`
- Payment Endpoints - `/api/v1/payment/process`

---

## 🔍 Troubleshooting

### Common Issues

#### Agent Fails to Start
```bash
# Check Node.js version
node --version  # Should be v20+

# Install dependencies
npm install

# Check agent permissions
ls -la agents/
```

#### Tests Fail
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- backend/__tests__/product.test.js

# Run tests with coverage
npm test -- --coverage
```

#### Security Agent Fails
```bash
# Run npm audit manually
npm audit

# Fix vulnerabilities
npm audit fix

# Check required middleware
grep -r "helmet\|cors\|rateLimit" backend/app.js
```

#### Coverage Agent Fails
```bash
# Generate coverage report
npm test -- --coverage

# Check coverage thresholds
cat package.json | grep -A 10 coverageThreshold
```

---

## 📞 Support

### Getting Help
- Check documentation in `/docs/`
- Review agent specifications
- Check codebase analysis report
- Review implementation roadmap

### Reporting Issues
- Include agent name
- Include error message
- Include execution context
- Include expected behavior

---

## 🔄 Updates

### Version History
- v1.0.0 (2026-04-30) - Initial release

### Upcoming Features
- [ ] Auto-fix capabilities
- [ ] Predictive analysis
- [ ] Self-healing system
- [ ] Enhanced monitoring

---

**Quick Reference Version**: 1.0.0
**Last Updated**: 2026-04-30
**Maintained By**: SDLC Agentic AI System
