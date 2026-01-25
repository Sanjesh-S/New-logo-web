export interface YesNoPrice {
    yes: number
    no: number
}

export interface PricingRules {
    questions: {
        powerOn: YesNoPrice
        bodyDamage: YesNoPrice
        lcdWorking: YesNoPrice
        lensScratches: YesNoPrice
        autofocusWorking: YesNoPrice
        additionalLens: YesNoPrice
    }
    lensCondition: {
        withoutLens: number
        good: number
        autofocusIssue: number
        fungus: number
        scratches: number
    }
    displayCondition: {
        excellent: number
        good: number
        fair: number
        cracked: number
    }
    bodyCondition: {
        excellent: number
        good: number
        fair: number
        poor: number
    }
    errorCondition: {
        noErrors: number
        minorErrors: number
        frequentErrors: number
    }
    functionalIssues: {
        batteryIssue: number
        flashlightIssue: number
        memoryCardIssue: number
        speakerIssue: number
        connectorIssue: number
        buttonIssue: number
        noIssues: number
    }
    accessories: {
        adapter: number
        battery: number
        box: number
        cable: number
        tripod: number
    }
    age: {
        lessThan3Months: number
        fourToTwelveMonths: number
        aboveTwelveMonths: number
    }
}

// Default values mirroring existing modifiers.ts
export const DEFAULT_PRICING_RULES: PricingRules = {
    questions: {
        powerOn: { yes: 0, no: -5000 },
        bodyDamage: { yes: -2000, no: 0 },
        lcdWorking: { yes: 0, no: -3000 },
        lensScratches: { yes: -1500, no: 0 },
        autofocusWorking: { yes: 0, no: -2500 },
        additionalLens: { yes: 1500, no: 0 },
    },
    lensCondition: {
        withoutLens: -2000,
        good: 0,
        autofocusIssue: -3000,
        fungus: -5000,
        scratches: -2000,
    },
    displayCondition: {
        excellent: 0,
        good: -1000,
        fair: -2500,
        cracked: -8000,
    },
    bodyCondition: {
        excellent: 0,
        good: -1500,
        fair: -3000,
        poor: -6000,
    },
    errorCondition: {
        noErrors: 0,
        minorErrors: -2000,
        frequentErrors: -5000,
    },
    functionalIssues: {
        batteryIssue: -2000,
        flashlightIssue: -1000,
        memoryCardIssue: -1500,
        speakerIssue: -800,
        connectorIssue: -1200,
        buttonIssue: -1500,
        noIssues: 0,
    },
    accessories: {
        adapter: 500,
        battery: 800,
        box: 1000,
        cable: 400,
        tripod: 2000,
    },
    age: {
        lessThan3Months: 0,
        fourToTwelveMonths: -2000,
        aboveTwelveMonths: -4000,
    },
}
