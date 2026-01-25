/**
 * Feedback Analyzer - Analyzes collected metrics and generates actionable feedback
 *
 * Evaluates game balance, difficulty, fun factor, and provides improvement suggestions.
 */

class FeedbackAnalyzer {
    constructor() {
        // Baseline expectations for a well-balanced game
        this.baselines = {
            // Performance
            minAcceptableFps: 30,
            targetFps: 60,

            // Combat balance
            idealAccuracy: { min: 0.3, max: 0.7 },  // 30-70% hit rate
            idealChargeUsage: { min: 0.4, max: 0.8 },  // Should use charged shots
            shotsPerMinute: { min: 20, max: 60 },

            // Survival balance
            idealDamageRate: { min: 10, max: 40 },  // Damage per minute
            maxDeaths: 3,  // Too many deaths = frustrating
            lowHealthTimePercent: { max: 30 },  // Shouldn't be low health >30% of time

            // Difficulty
            idealEnemyDensity: { min: 2, max: 6 },
            overwhelmedTimePercent: { max: 20 },

            // Engagement
            minScorePerMinute: 300,
            minCompletionPercent: 50,  // Should get at least halfway

            // Movement
            idealLateralRatio: { min: 0.1, max: 0.4 }  // Lateral vs total movement
        };
    }

    analyze(metrics, profile) {
        const feedback = {
            profile: profile?.name || 'Unknown',
            timestamp: new Date().toISOString(),
            overallRating: 0,  // 1-10 scale
            categories: {},
            issues: [],
            positives: [],
            suggestions: [],
            balanceAssessment: {},
            performanceAnalysis: {}
        };

        // Analyze each category
        feedback.categories.performance = this.analyzePerformance(metrics, feedback);
        feedback.categories.difficulty = this.analyzeDifficulty(metrics, profile, feedback);
        feedback.categories.engagement = this.analyzeEngagement(metrics, profile, feedback);
        feedback.categories.combat = this.analyzeCombat(metrics, profile, feedback);
        feedback.categories.survival = this.analyzeSurvival(metrics, profile, feedback);
        feedback.categories.movement = this.analyzeMovement(metrics, feedback);

        // Calculate overall rating
        const categoryScores = Object.values(feedback.categories);
        feedback.overallRating = (categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length).toFixed(1);

        // Generate summary
        feedback.summary = this.generateSummary(feedback);

        return feedback;
    }

    analyzePerformance(metrics, feedback) {
        let score = 10;
        const perf = metrics.performance;

        if (!perf.averageFps) {
            feedback.issues.push({
                severity: 'warning',
                category: 'performance',
                message: 'FPS data not collected - unable to assess performance'
            });
            return 5;
        }

        // FPS analysis
        if (perf.averageFps < this.baselines.minAcceptableFps) {
            score -= 4;
            feedback.issues.push({
                severity: 'critical',
                category: 'performance',
                message: `Average FPS (${perf.averageFps.toFixed(1)}) is below minimum acceptable (${this.baselines.minAcceptableFps})`,
                suggestion: 'Reduce visual effects, particle count, or entity limits'
            });
        } else if (perf.averageFps < this.baselines.targetFps) {
            score -= 2;
            feedback.issues.push({
                severity: 'warning',
                category: 'performance',
                message: `Average FPS (${perf.averageFps.toFixed(1)}) is below target (${this.baselines.targetFps})`,
                suggestion: 'Consider optimizing render loop or reducing draw calls'
            });
        } else {
            feedback.positives.push('Smooth frame rate maintained throughout gameplay');
        }

        // FPS stability
        if (perf.minFps && perf.maxFps) {
            const variance = perf.maxFps - perf.minFps;
            if (variance > 30) {
                score -= 1;
                feedback.issues.push({
                    severity: 'minor',
                    category: 'performance',
                    message: `High FPS variance (${perf.minFps.toFixed(0)}-${perf.maxFps.toFixed(0)}) may cause stuttering`,
                    suggestion: 'Investigate frame spikes during heavy gameplay moments'
                });
            }
        }

        feedback.performanceAnalysis = {
            averageFps: perf.averageFps?.toFixed(1),
            minFps: perf.minFps?.toFixed(1),
            maxFps: perf.maxFps?.toFixed(1),
            stability: perf.minFps && perf.maxFps
                ? ((perf.minFps / perf.maxFps) * 100).toFixed(0) + '%'
                : 'N/A'
        };

        return Math.max(1, score);
    }

    analyzeDifficulty(metrics, profile, feedback) {
        let score = 10;
        const diff = metrics.difficulty;
        const survival = metrics.survival;
        const profileName = profile?.name || 'Average';

        // Assess based on player profile expectations
        const expectations = {
            'Novice': { maxDeaths: 5, idealCompletion: 30, expectedAccuracy: 0.2 },
            'Average': { maxDeaths: 3, idealCompletion: 60, expectedAccuracy: 0.4 },
            'Skilled': { maxDeaths: 1, idealCompletion: 85, expectedAccuracy: 0.6 },
            'Expert': { maxDeaths: 0, idealCompletion: 100, expectedAccuracy: 0.75 },
            'Chaotic': { maxDeaths: 10, idealCompletion: 20, expectedAccuracy: 0.15 },
            'AFK': { maxDeaths: 10, idealCompletion: 5, expectedAccuracy: 0.05 }
        };
        const expect = expectations[profileName] || expectations['Average'];

        // Death count analysis
        if (survival.deaths > expect.maxDeaths + 2) {
            score -= 3;
            feedback.issues.push({
                severity: 'critical',
                category: 'difficulty',
                message: `Too many deaths (${survival.deaths}) for ${profileName} player profile`,
                suggestion: 'Consider reducing enemy damage, spawn rates, or adding health pickups'
            });
        } else if (survival.deaths <= expect.maxDeaths) {
            feedback.positives.push(`Death count (${survival.deaths}) appropriate for ${profileName} skill level`);
        }

        // Enemy density
        if (diff.averageEnemyDensity > this.baselines.idealEnemyDensity.max) {
            score -= 2;
            feedback.issues.push({
                severity: 'warning',
                category: 'difficulty',
                message: `High average enemy density (${diff.averageEnemyDensity.toFixed(1)}) may overwhelm players`,
                suggestion: 'Reduce enemy spawn rate or max enemy count'
            });
        } else if (diff.averageEnemyDensity < this.baselines.idealEnemyDensity.min) {
            score -= 1;
            feedback.issues.push({
                severity: 'minor',
                category: 'difficulty',
                message: `Low enemy density (${diff.averageEnemyDensity.toFixed(1)}) - game may feel empty`,
                suggestion: 'Increase enemy spawn rate for more action'
            });
        }

        // Overwhelmed time
        const duration = metrics.flow?.duration || 1;
        const overwhelmedPercent = (diff.overwhelmedTime / 1000 / duration) * 100;
        if (overwhelmedPercent > this.baselines.overwhelmedTimePercent.max) {
            score -= 2;
            feedback.issues.push({
                severity: 'warning',
                category: 'difficulty',
                message: `Player overwhelmed ${overwhelmedPercent.toFixed(0)}% of the time (5+ enemies)`,
                suggestion: 'Add cooldown between enemy spawns or reduce spawn clustering'
            });
        }

        feedback.balanceAssessment.difficulty = {
            profileExpectations: expect,
            actualDeaths: survival.deaths,
            averageEnemyDensity: diff.averageEnemyDensity?.toFixed(1),
            overwhelmedPercent: overwhelmedPercent.toFixed(1) + '%',
            closeCalls: diff.closeCallCount
        };

        return Math.max(1, score);
    }

    analyzeEngagement(metrics, profile, feedback) {
        let score = 10;
        const flow = metrics.flow;
        const scoreData = metrics.score;

        // Score per minute (engagement indicator)
        if (scoreData.perMinute < this.baselines.minScorePerMinute) {
            score -= 2;
            feedback.issues.push({
                severity: 'warning',
                category: 'engagement',
                message: `Low scoring rate (${scoreData.perMinute}/min) - may indicate lack of action`,
                suggestion: 'Ensure targets are plentiful and scoring feels rewarding'
            });
        } else {
            feedback.positives.push(`Good scoring rate (${scoreData.perMinute}/min) keeps gameplay rewarding`);
        }

        // Game completion
        if (flow.gameCompletionPercent < this.baselines.minCompletionPercent) {
            if (flow.endCondition === 'died') {
                score -= 1;
                feedback.issues.push({
                    severity: 'minor',
                    category: 'engagement',
                    message: `Player died early (${flow.gameCompletionPercent.toFixed(0)}% completion)`,
                    suggestion: 'Early game may be too difficult - consider easier initial waves'
                });
            }
        }

        // Pause frequency (frustration indicator)
        if (flow.pauseCount > 5) {
            score -= 1;
            feedback.issues.push({
                severity: 'minor',
                category: 'engagement',
                message: `High pause count (${flow.pauseCount}) may indicate frustration or confusion`,
                suggestion: 'Review pacing and clarity of game objectives'
            });
        }

        // Session length assessment
        if (flow.duration && flow.duration < 30 && flow.endCondition !== 'completed') {
            score -= 2;
            feedback.issues.push({
                severity: 'warning',
                category: 'engagement',
                message: `Very short session (${flow.duration.toFixed(0)}s) - player may have quit early`,
                suggestion: 'Investigate why player disengaged - difficulty spike? Confusion?'
            });
        }

        return Math.max(1, score);
    }

    analyzeCombat(metrics, profile, feedback) {
        let score = 10;
        const combat = metrics.combat;
        const duration = metrics.flow?.duration || 1;

        // Hit accuracy
        if (combat.accuracy < this.baselines.idealAccuracy.min) {
            score -= 2;
            feedback.issues.push({
                severity: 'warning',
                category: 'combat',
                message: `Low hit accuracy (${(combat.accuracy * 100).toFixed(0)}%) - shooting may feel unrewarding`,
                suggestion: 'Consider larger hitboxes, aim assist, or slower enemy movement'
            });
        } else if (combat.accuracy > this.baselines.idealAccuracy.max) {
            score -= 1;
            feedback.issues.push({
                severity: 'minor',
                category: 'combat',
                message: `Very high accuracy (${(combat.accuracy * 100).toFixed(0)}%) - combat may be too easy`,
                suggestion: 'Consider smaller hitboxes or faster enemies for more challenge'
            });
        } else {
            feedback.positives.push(`Good hit accuracy (${(combat.accuracy * 100).toFixed(0)}%) - combat feels balanced`);
        }

        // Charge usage
        if (combat.averageChargePower < this.baselines.idealChargeUsage.min) {
            score -= 1;
            feedback.issues.push({
                severity: 'minor',
                category: 'combat',
                message: `Low charge usage (${(combat.averageChargePower * 100).toFixed(0)}%) - players not using charge mechanic`,
                suggestion: 'Make charged shots more rewarding or add visual feedback for charging'
            });
        }

        // Shots per minute
        const shotsPerMin = (combat.shotsFired / duration) * 60;
        if (shotsPerMin < this.baselines.shotsPerMinute.min) {
            score -= 1;
            feedback.issues.push({
                severity: 'minor',
                category: 'combat',
                message: `Low shot rate (${shotsPerMin.toFixed(0)}/min) - player may feel shooting is ineffective`,
                suggestion: 'Reduce cooldown or provide more targets'
            });
        } else if (shotsPerMin > this.baselines.shotsPerMinute.max) {
            feedback.positives.push('High engagement with shooting mechanics');
        }

        return Math.max(1, score);
    }

    analyzeSurvival(metrics, profile, feedback) {
        let score = 10;
        const survival = metrics.survival;
        const duration = metrics.flow?.duration || 1;

        // Damage rate
        const damagePerMin = (survival.damageTaken / duration) * 60;
        if (damagePerMin > this.baselines.idealDamageRate.max) {
            score -= 2;
            feedback.issues.push({
                severity: 'warning',
                category: 'survival',
                message: `High damage rate (${damagePerMin.toFixed(0)}/min) - player taking too much damage`,
                suggestion: 'Reduce enemy damage, collision frequency, or add invulnerability frames'
            });
        } else if (damagePerMin < this.baselines.idealDamageRate.min && duration > 30) {
            score -= 1;
            feedback.issues.push({
                severity: 'minor',
                category: 'survival',
                message: `Low damage rate (${damagePerMin.toFixed(0)}/min) - game may lack tension`,
                suggestion: 'Increase enemy aggression or spawn rates'
            });
        }

        // Low health time
        const lowHealthPercent = (survival.timeAtLowHealth / 1000 / duration) * 100;
        if (lowHealthPercent > this.baselines.lowHealthTimePercent.max) {
            score -= 2;
            feedback.issues.push({
                severity: 'warning',
                category: 'survival',
                message: `Spent ${lowHealthPercent.toFixed(0)}% of time at low health - may be frustrating`,
                suggestion: 'Add health pickups or regeneration mechanic'
            });
        } else if (lowHealthPercent > 10) {
            feedback.positives.push('Good tension from health management without being overwhelming');
        }

        return Math.max(1, score);
    }

    analyzeMovement(metrics, feedback) {
        let score = 10;
        const movement = metrics.movement;

        // Lateral movement ratio (indicates dodging behavior)
        if (movement.totalDistance > 0) {
            const lateralRatio = movement.lateralMovement / movement.totalDistance;

            if (lateralRatio < this.baselines.idealLateralRatio.min) {
                score -= 1;
                feedback.issues.push({
                    severity: 'minor',
                    category: 'movement',
                    message: `Low lateral movement (${(lateralRatio * 100).toFixed(0)}%) - player not dodging`,
                    suggestion: 'Ensure dodge mechanic is intuitive and effective for avoiding damage'
                });
            } else if (lateralRatio > this.baselines.idealLateralRatio.max) {
                feedback.positives.push('Active use of dodging mechanics');
            }
        }

        // Wall bumps (navigation difficulty indicator)
        if (movement.wallBumps > 10) {
            score -= 1;
            feedback.issues.push({
                severity: 'minor',
                category: 'movement',
                message: `High wall bump count (${movement.wallBumps}) - player struggling with navigation`,
                suggestion: 'Consider widening corridors or adding visual boundary indicators'
            });
        }

        return Math.max(1, score);
    }

    generateSummary(feedback) {
        const rating = parseFloat(feedback.overallRating);
        let summary = '';

        // Overall assessment
        if (rating >= 8) {
            summary = 'Excellent gameplay experience. ';
        } else if (rating >= 6) {
            summary = 'Good gameplay with room for improvement. ';
        } else if (rating >= 4) {
            summary = 'Gameplay has significant issues that need addressing. ';
        } else {
            summary = 'Gameplay experience needs major work. ';
        }

        // Top issues
        const criticalIssues = feedback.issues.filter(i => i.severity === 'critical');
        const warnings = feedback.issues.filter(i => i.severity === 'warning');

        if (criticalIssues.length > 0) {
            summary += `Found ${criticalIssues.length} critical issue(s) requiring immediate attention. `;
        }
        if (warnings.length > 0) {
            summary += `${warnings.length} warning(s) should be addressed. `;
        }

        // Positives
        if (feedback.positives.length > 0) {
            summary += `Highlights: ${feedback.positives.slice(0, 2).join('; ')}. `;
        }

        // Top suggestion
        if (feedback.issues.length > 0) {
            const topIssue = criticalIssues[0] || warnings[0] || feedback.issues[0];
            summary += `Priority: ${topIssue.suggestion}`;
        }

        return summary;
    }

    // Generate comparative analysis across multiple sessions
    compareProfiles(allResults) {
        const comparison = {
            profiles: {},
            rankings: {},
            insights: []
        };

        for (const [profileName, results] of Object.entries(allResults)) {
            comparison.profiles[profileName] = {
                avgScore: results.reduce((a, r) => a + r.score.final, 0) / results.length,
                avgCompletion: results.reduce((a, r) => a + r.flow.gameCompletionPercent, 0) / results.length,
                avgDeaths: results.reduce((a, r) => a + r.survival.deaths, 0) / results.length,
                avgAccuracy: results.reduce((a, r) => a + r.combat.accuracy, 0) / results.length
            };
        }

        // Generate insights
        const profiles = Object.entries(comparison.profiles);
        if (profiles.length > 1) {
            // Find difficulty spread
            const completionRates = profiles.map(([name, data]) => ({ name, completion: data.avgCompletion }));
            completionRates.sort((a, b) => b.completion - a.completion);

            const spread = completionRates[0].completion - completionRates[completionRates.length - 1].completion;
            if (spread > 50) {
                comparison.insights.push({
                    type: 'balance',
                    message: `Large skill gap: ${completionRates[0].name} completes ${completionRates[0].completion.toFixed(0)}% while ${completionRates[completionRates.length - 1].name} only reaches ${completionRates[completionRates.length - 1].completion.toFixed(0)}%`,
                    suggestion: 'Consider adding difficulty settings or adaptive difficulty'
                });
            }
        }

        return comparison;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeedbackAnalyzer;
}
