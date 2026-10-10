import type { HistoricalEra } from '../types';

export const SAMPLE_LANDSCAPE_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA8hlaQUW3B0h7DYvWg_T20tqqDCOkF5otOh8_kfDGTMOxdmPd513TFErmJt4K-Nnm-qGWx8hoLCgijU21csKUEsQqGoSfWStTSVEG6qjzC1oDO3pCvi03LWLktQ0gZ_90Jx2M8WOj8rOac8qZ8DpdvoHxDwKrdpqUu2h-EacEgtk8JXG_mM1GTiuBeOGK1ZjjFO0dZg6P3FvIDYirk5peG79QKYKRQL1SXxvHgCTsjdZaso9-dS-aLAA';

export const SAMPLE_SELFIE_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBxgG_nvKYuaduH-fTQH9Df6Kvo-doeEYsjm79sthGumdN2le5anQ86IVBPf6vjWHqWxAb7WwNsVN0_jNGL2lWan-FaTNM4N_CY98x-BSrOLt0r3MPFkLBplPCTPcG9SVc-Le1V4ghb0IcCzFRl83tRgO9FsUbbexktzzx9lY27E3TS_aUqUDQ6lYz1sj64aXTNjBd7XU5y-T8OF58mgGsESbyeWmLMgfM86CjgeCJOMePH4lqIrpAqNQ';

export const SAMPLE_RECONSTRUCTION_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDcTnpmhreWmbj7j4oXoXCONSkQr9tVR-cBCWYtFfRow4FZLR2KqJZ8W3xYeFWwy1PF36uSDZsISq9F4qKBwpeOOOUWUr2v-q3HeuP01fa8rgXzjkJjCbaAvWEpYs4SsEJ6ASfpmipFTPko_x_dfHNmqs6uc5qzzWpSrodJDmJFyQmZSIeXYDupDXycS7KSe1TJ3eYai65japDQa1cZHmhYimtw_slgvATe79z3y_V0ZxmplJSvt48Wzw';

export const SAMPLE_MODERN_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBBDZ4tgqAQVBNQBFtbwHAeOhCuoUHttQjWee-dDFabxIzhWNNjxk8N5H1vaIONRQnnAok_qzan4NvoYZweeAE6ojrdIOZM5JKsLHHA-GPnNTkI9--qmBtW10fvg5mkiuJT6mDpSBQkbQOaBgGx1e9pLUZ1rvYHurbuUu8wYv6eJ6mRNxGPnuebvSgAN16oKQdDkbpLl6A0LDjyu4WtmE5lwKgdMfqkzVf6HEW6lq0bMVvVhAHi3LFjyg';

export const HISTORICAL_ERAS: HistoricalEra[] = [
  {
    id: 'carboniferous',
    name: 'Carboniferous Primeval Swamp',
    yearLabel: '300M BCE',
    numericYear: -300000000,
    yearSuffix: 'BCE',
    category: 'PALEOZOIC',
    filterTag: 'Deep Paleozoic',
    description:
      'Towering giant club mosses, fern canopies, and hyper-oxygenated atmospheric moisture before dinosaurs appeared.',
    avgTemp: '20.2°C',
    co2Level: '800 ppm',
    floraIndex: 'Primeval 98',
    floraLabel: 'Flora Index',
    durationLabel: 'Late Paleozoic Era',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDqVMVChIeV6-eUGJGiMwoyWItiCrZYSLSk8DlHtFKn_4DRoYzv6dK8sldknbqitbsl1iRA8_W7Lw5PH4EbNhj2uvNuY5S9aMDHSyMWYP75bngChlgdI47ZE10OFkY6PwwPKTx43EVI3YQ2by8e9pd0g_GEl7-z2qXTR0TVoGok2NY1hVvMerA5usRe_UiFyStbwA6KBeH6JbKDMO_E8cYkh85bhcC_shp36WVM3Qt-znC78YJEqg3bYg',
  },
  {
    id: 'cretaceous',
    name: 'Late Cretaceous Dinosaur Era',
    yearLabel: '68M BCE',
    numericYear: -68000000,
    yearSuffix: 'BCE',
    category: 'MESOZOIC',
    filterTag: 'Mesozoic Fauna',
    description:
      'The age of dinosaurs featuring early flowering plants, ancient conifers, and warm greenhouse climates.',
    avgTemp: '18.5°C',
    co2Level: '1,200 ppm',
    floraIndex: 'Arboreal 84',
    floraLabel: 'Flora Index',
    durationLabel: 'Mesozoic Era',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCfxp3I3ol5DjdZxIoO5V5TMr3COWTfCYygzJH07BowWtCQwRtOmDnWo56S-nnDoekxdzeGIsnTAH9D9eYnhbUGF8LmdOMnXAR1lHy3tNsClNpIv9QXLVxUKkjgehm5eg5zSCLEru9m22ZWyOPhhyUB3MGLpl2IwS0O2Zxpn_WB30cQKr8gKObdnCXDuc-ygGQ9dYrk2zp6LcMAltlzVvE1SoHEAWDd0jIJnFreAut_8ISePCGnQTYBaA',
  },
  {
    id: 'pleistocene',
    name: 'Pleistocene Ice Age & Stone Age',
    yearLabel: '18,000 BCE',
    numericYear: -18000,
    yearSuffix: 'BCE',
    category: 'QUATERNARY',
    filterTag: 'Quaternary Ice',
    description:
      'Glacial ice sheets, permafrost tundra, mammoth steppes, and early human hunter-gatherer migrations.',
    avgTemp: '3.8°C',
    tempDelta: '-17.6°C',
    co2Level: '190 ppm',
    floraIndex: 'Steppe-Taiga 61',
    floraLabel: 'Flora Index',
    durationLabel: 'Last Glacial Maximum',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB3ousEtG-Ml9PpRLhGIULWq8Or8ZGnTODiCxqj6zoGT_41p5F03jS1aoMLBAmqkUmcuL2W1kradOzVv8ftZCOtUhHw8pB_f2KYGOoSR_nB9hndfyGwt6G_FGszkNcKZv3Vgo1B6MTtjD02UKtQeDokixiOf6PxbeUibivJnVEpLUySTli6hQ2vGsNiVObRM3U7UydCYE4-ZB9apSk64Ip58OqajBKmbbdoPT9nVzEEUYUrUaz3e7jpLQ',
    isCalibratedBaseline: true,
  },
  {
    id: 'ancient-antiquity',
    name: 'Classical Antiquity & Ancient History',
    yearLabel: '500 BCE',
    numericYear: -500,
    yearSuffix: 'BCE',
    category: 'HOLOCENE',
    filterTag: 'Holocene Biomes',
    description:
      'Ancient civilizations, early agricultural landscapes, terraced olive groves, and Mediterranean trade routes.',
    avgTemp: '12.1°C',
    co2Level: '275 ppm',
    floraIndex: 'Agricultural 76',
    floraLabel: 'Flora Index',
    durationLabel: 'Classical Era',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBBDZ4tgqAQVBNQBFtbwHAeOhCuoUHttQjWee-dDFabxIzhWNNjxk8N5H1vaIONRQnnAok_qzan4NvoYZweeAE6ojrdIOZM5JKsLHHA-GPnNTkI9--qmBtW10fvg5mkiuJT6mDpSBQkbQOaBgGx1e9pLUZ1rvYHurbuUu8wYv6eJ6mRNxGPnuebvSgAN16oKQdDkbpLl6A0LDjyu4WtmE5lwKgdMfqkzVf6HEW6lq0bMVvVhAHi3LFjyg',
  },
  {
    id: 'indigenous-old-growth',
    name: 'Ancient Indigenous Old Growth',
    yearLabel: '1100 CE',
    numericYear: 1100,
    yearSuffix: 'CE',
    category: 'MEDIEVAL CLIMATIC',
    filterTag: 'Holocene Biomes',
    description:
      'Pristine old-growth red cedar and pine forests, stable floodplains, and traditional indigenous forest stewardship.',
    avgTemp: '10.4°C',
    co2Level: '280 ppm',
    floraIndex: 'Climax Rain 94',
    floraLabel: 'Flora Index',
    durationLabel: 'Medieval Warm Period',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB-n_a0puGnxy4LQaeontNn2ETZzNAPm4I6owTaG5jAm4bHcTQ2meUyCTO9fMZvCU4vvCdP891dJFZJzZoDyb7kLvUpBb1jOc-mKf7cOMx47JBFzt8BX01H3TFQh9ovbID2NdYmugrkJu6pnoZYSV4UofqszOVnS3q5bO66VBt4ohB-OuRUY1MGIU9PYnuNdLUSHVd9uJeYpAre6czhxrRwpzBOcRHWi8HICDJ9rWLRWMhFpY8OM83Z9w',
  },
  {
    id: 'early-anthropocene',
    name: 'Early Anthropocene Frontier',
    yearLabel: '1840 CE',
    numericYear: 1840,
    yearSuffix: 'CE',
    category: 'EARLY ANTHROPOCENE',
    filterTag: 'Holocene Biomes',
    description:
      'Pre-industrial wilderness, early frontier timberline settlements, and clean atmosphere prior to heavy industrialization.',
    avgTemp: '9.1°C',
    co2Level: '284 ppm',
    floraIndex: 'Montane 88',
    floraLabel: 'Flora Index',
    durationLabel: 'Early Industrial Era',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC1RUmuadK_8NlxviaA3FaFezIgbGxFwEQF6VNBjkngSGX44pcPMXS_l0DUdKLuQMsVuqG9wrg8DOoi8D6FUC_RiPoMWm2PLFJ3TuzDaS4oF92p86vLpnFNuBLLxorwq2Ra10bKPXWiEU9I29zbprcEuRhA58DU9dWvr7SVnGXGgqzureiw-4B7M4SCI8vPtDaeh4HIOUClyRMMSeySBKP0Shtg7uVtLXjS2IoZ4SfoHUHr5RsQxPItCA',
  },
];
