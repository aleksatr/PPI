import { expect } from 'chai';
import * as utils from 'src/utils.js';
import * as aup from 'modules/ppi/hbInventory/aup/aup.js';
import * as aupSizes from 'modules/ppi/hbInventory/aup/sizes.js'
import { TransactionType } from 'modules/ppi/hbInventory/aup/consts.js';
import { makeSlot } from '../integration/faker/googletag.js';

function makeGPTSlot(adUnitPath, divId, sizes = []) {
  let gptSlot = makeSlot({ code: adUnitPath, divId: divId });
  let sizeObj = [];
  sizes.forEach(size => {
    sizeObj.push({
      size,
      getWidth: () => {
        return size[0];
      },
      getHeight: () => {
        return size[1];
      }
    })
  });
  gptSlot.getSizes = () => {
    return sizeObj;
  }
  return gptSlot;
}

describe('autoSlot transformation', () => {
  let to = {
    hbInventory: {
      type: TransactionType.AUTO_SLOTS,
    },
    hbSource: 'auction',
    hbDestination: {
      type: 'cache',
    }
  };
  const initialSlots = window.googletag.pubads().getSlots();
  it('should not create any TOs when no gpt slot is created', () => {
    window.googletag.pubads().setSlots([]);
    let transformed = aup.transformAutoSlots(to);
    expect(transformed.length).to.equal(0);
  });

  it('should transform autoSlot into array of slot objects', () => {
    window.googletag.pubads().setSlots([]);
    const testSlots = [
      makeSlot({ code: 'slotCode1', divId: 'div1' }),
      makeSlot({ code: 'slotCode2', divId: 'div2' }),
      makeSlot({ code: 'slotCode3', divId: 'div3' })
    ];
    let transformed = aup.transformAutoSlots(to);
    expect(transformed.length).to.equal(testSlots.length);
    for (let i = 0; i < testSlots.length; i++) {
      let transformedTO = transformed[i];

      // source and destination should be copied from original TO
      expect(transformedTO.hbSource).to.equal(to.hbSource);
      expect(transformedTO.hbDestination.type).to.equal(to.hbDestination.type);

      expect(transformedTO.hbInventory.values.slot.getAdUnitPath()).to.equal(testSlots[i].getAdUnitPath());
      expect(transformedTO.hbInventory.values.slot.getSlotElementId()).to.equal(testSlots[i].getSlotElementId());
    }
  });
  window.googletag.pubads().setSlots(initialSlots);
});

describe('add adUnitPattern', () => {
  it('should validate aup before adding', () => {
    while (aup.adUnitPatterns.length) aup.adUnitPatterns.pop();
    let validAUPs = [
      {
        slotPattern: '^.*header-bid-tag-0$',
        divPattern: 'test-*',
        bids: [
          {
            bidder: 'rubicon',
            params: {
              accountId: '1001',
              siteId: '113932',
              zoneId: '535510',
            }
          }
        ],
        mediaTypes: {
          banner: {
            sizes: [[300, 250], [300, 600]]
          },
        },
      },
      {
        // convert size array to matrix
        slotPattern: '',
        divPattern: 'test-*',
        bids: [
          {
            bidder: 'rubicon',
            params: {
              accountId: '1001',
              siteId: '113932',
              zoneId: '535510',
            }
          }
        ],
        mediaTypes: {
          banner: {
            sizes: [1, 1]
          },
        },
      },
      {
        // ppi should remove invalid '2' from array sizes
        slotPattern: '^.*header-bid-tag-0$',
        divPattern: '',
        bids: [
          {
            bidder: 'rubicon',
            params: {
              accountId: '1001',
              siteId: '113932',
              zoneId: '535510',
            }
          }
        ],
        mediaTypes: {
          banner: {
            sizes: [[1, 1], 2]
          },
        },
      },
    ];
    let invalidAUPs = [
      {
        // can't have empty strings for both slotPattern and divPattern
        slotPattern: '',
        divPattern: '',
        bids: [
          {
            bidder: 'rubicon',
            params: {
              accountId: '1001',
              siteId: '113932',
              zoneId: '535510',
            }
          }
        ],
        mediaTypes: {
          banner: {
            sizes: [[300, 250], [300, 600]]
          },
        },
      },
      {
        // size can't be boolean
        slotPattern: '^.*header-bid-tag-0$',
        divPattern: '',
        bids: [
          {
            bidder: 'rubicon',
            params: {
              accountId: '1001',
              siteId: '113932',
              zoneId: '535510',
            }
          }
        ],
        mediaTypes: {
          banner: {
            sizes: true
          },
        },
      },
    ];

    aup.addAdUnitPatterns(invalidAUPs);
    expect(aup.adUnitPatterns.length).to.equal(0);

    aup.addAdUnitPatterns(validAUPs);
    expect(aup.adUnitPatterns.length).to.equal(validAUPs.length);
    for (let i = 1; i < aup.adUnitPatterns.length; i++) {
      expect(aup.adUnitPatterns[i].mediaTypes.banner.sizes).to.deep.equal([[1, 1]]);
    }
  });
});

describe('add adUnitPattern', () => {
  let adUnitPatterns = [
    {
      slotPattern: '^.*header-bid-tag-.*$',
      divPattern: 'test-*',
      code: 'pattern-1',
      bids: [
        {
          bidder: 'rubicon',
          params: {
            accountId: '1001',
            siteId: '113932',
            zoneId: '535510',
          }
        }
      ],
      mediaTypes: {
        banner: {
          sizes: [[1, 1]]
        },
      },
    },
    {
      slotPattern: '^.*header-bid-tag-.*$',
      divPattern: 'test-*',
      code: 'pattern-2',
      bids: [
        {
          bidder: 'rubicon',
          params: {
            accountId: '1001',
            siteId: '113932',
            zoneId: '535510',
          }
        }
      ],
      mediaTypes: {
        banner: {
          sizes: [[1, 1]]
        },
      },
    },
    {
      slotPattern: '',
      divPattern: 'test-*',
      bids: [
        {
          bidder: 'rubicon',
          params: {
            accountId: '1001',
            siteId: '113932',
            zoneId: '535510',
          }
        }
      ],
      mediaTypes: {
        banner: {
          sizes: [[1, 1]]
        },
      },
    },
  ];

  it('should match TO against AUP', () => {
    let tos = [
      {
        hbInventory: {
          type: TransactionType.DIV,
          values: {
            name: 'test-1',
          }
        },
        hbSource: 'auction',
        hbDestination: {
          type: 'gpt',
          values: { div: 'test-1' }
        }
      },
      {
        hbInventory: {
          type: TransactionType.SLOT,
          values: {
            name: '/19968336/header-bid-tag-0',
          }
        },
        hbSource: 'auction',
        sizes: [[1, 1]],
        hbDestination: {
          type: 'gpt',
          values: { div: 'test-2' }
        }
      },
      {
        hbInventory: {
          type: TransactionType.SLOT,
          values: {
            name: '/19968336/header-bid-tag-0',
          }
        },
        hbSource: 'auction',
        hbDestination: {
          type: 'gpt',
          values: { div: 'test-3' }
        },
      },
    ];

    while (aup.adUnitPatterns.length) aup.adUnitPatterns.pop();
    expect(aup.adUnitPatterns.length).to.equal(0);
    aup.addAdUnitPatterns(adUnitPatterns);
    let result = aup.matchAUPs(tos, aup.adUnitPatterns);
    expect(tos.length).to.equal(result.length);
    for (let i = 0; i < result.length; i++) {
      expect(tos[i]).to.equal(result[i].transactionObject);
    }
    for (let i = 0; i < result.length - 1; i++) {
      expect(adUnitPatterns[i].hbSource).to.equal(result[i].adUnitPattern.hbSource);
      expect(adUnitPatterns[i].hbDestination).to.deep.equal(result[i].adUnitPattern.hbDestination);
    }
    expect(result[2].adUnitPattern).to.be.a('undefined');
  });

  it('should match gpt slot', () => {
    while (aup.adUnitPatterns.length) aup.adUnitPatterns.pop();
    window.googletag.pubads().setSlots([]);

    let gptSlotSizes = [[1, 1], [2, 2]];
    let gptSlots = [
      makeGPTSlot('/19968336/header-bid-tag-0', 'test-1', gptSlotSizes),
      makeGPTSlot('/19968336/header-bid-tag-1', 'test-2', gptSlotSizes),
    ];

    let tos = [
      {
        hbInventory: {
          type: TransactionType.SLOT_OBJECT,
          values: {
            slot: gptSlots[0],
          }
        },
        hbSource: 'auction',
        hbDestination: {
          type: 'gpt',
          values: { div: 'test-1' }
        }
      },
      {
        hbInventory: {
          type: TransactionType.SLOT_OBJECT,
          values: {
            slot: gptSlots[1],
          }
        },
        hbSource: 'auction',
        sizes: [[1, 1]],
        hbDestination: {
          type: 'cache',
          values: { div: 'test-2' }
        }
      },
    ];

    aup.addAdUnitPatterns(adUnitPatterns);
    let result = aup.matchAUPs(tos, aup.adUnitPatterns);
    expect(tos.length).to.equal(result.length);
    for (let i = 0; i < result.length - 1; i++) {
      expect(adUnitPatterns[i].hbSource).to.equal(result[i].adUnitPattern.hbSource);
      expect(adUnitPatterns[i].hbDestination).to.deep.equal(result[i].adUnitPattern.hbDestination);
    }
  });

  it('should create pbjs adUnit and match it with transaction Object', () => {
    while (aup.adUnitPatterns.length) aup.adUnitPatterns.pop();
    window.googletag.pubads().setSlots([]);

    let gptSlotSizes = [[1, 1], [2, 2]];
    let gptSlot = makeGPTSlot('/19968336/header-bid-tag-1', 'test-3', gptSlotSizes);

    let tos = [
      {
        hbInventory: {
          type: TransactionType.DIV,
          values: {
            name: 'test-1',
          }
        },
        hbSource: 'auction',
        hbDestination: {
          type: 'gpt',
          values: { div: 'test-1' }
        }
      },
      {
        hbInventory: {
          type: TransactionType.SLOT,
          values: {
            name: '/19968336/header-bid-tag-0',
          }
        },
        hbSource: 'auction',
        sizes: [[1, 1]],
        hbDestination: {
          type: 'gpt',
          values: { div: 'test-2' }
        }
      },
      {
        hbInventory: {
          type: TransactionType.SLOT_OBJECT,
          values: {
            slot: gptSlot,
          }
        },
        hbSource: 'auction',
        hbDestination: {
          type: 'gpt',
          values: { div: 'test-3' }
        },
      },
    ];

    aup.addAdUnitPatterns(adUnitPatterns);
    let result = aup.createAdUnits(tos);
    expect(result.length).to.equal(tos.length);
    expect(result[0].adUnit.code).to.equal('pattern-1');
    expect(result[1].adUnit.code).to.equal('pattern-2');
    expect(result[2].adUnit.code).to.be.a('string');
  });

  describe('create adUnit', () => {
    it('should create pbjs adUnit from AUP', () => {
      let sizes = [[1, 1], [1, 2], [2, 1], [2, 2]];
      let adUnitPattern = {
        slotPattern: '^.*header-bid-tag-.*$',
        divPattern: 'test-*',
        bids: [
          {
            bidder: 'rubicon',
            params: {
              accountId: '1001',
              siteId: '113932',
              zoneId: '535510',
            }
          }
        ],
      };
      let to = {
        hbInventory: {
          type: TransactionType.SLOT,
          values: {
            name: '/19968336/header-bid-tag-0',
          },
          sizes: sizes,
        },
      };

      let adUnit = aup.createAdUnit(adUnitPattern, to);
      expect(adUnitPattern.bids).to.deep.equal(adUnit.bids);
      expect(sizes).to.deep.equal(utils.deepAccess(adUnit, 'mediaTypes.banner.sizes'));
      expect(adUnit.slotPattern).to.be.a('undefined');
      expect(adUnit.divPattern).to.be.a('undefined');
      expect(adUnit.code).to.be.a('string');

      // now add code to aup
      adUnitPattern.code = 'pattern-1';
      adUnit = aup.createAdUnit(adUnitPattern, to);
      expect(adUnit.code).to.equal('pattern-1');

      // now add sizes to aup
      utils.deepSetValue(adUnitPattern, 'mediaTypes.banner.sizes', sizes);
      to.hbInventory.sizes = [];
      adUnit = aup.createAdUnit(adUnitPattern, to);
      expect(adUnit.mediaTypes.banner.sizes).to.deep.equal(sizes);

      // now do the size intersection between adUnitPattern sizes and limit sizes
      to.hbInventory.sizes = [[2, 2], [1, 1], [3, 3], [4, 4]];
      adUnit = aup.createAdUnit(adUnitPattern, to);
      expect(adUnit.mediaTypes.banner.sizes).to.deep.equal([[4, 4], [3, 3], [2, 2], [1, 1]]);
    });
  });
});

describe('responsive sizes', () => {
  it('should consider viewport for AUP sizes', () => {
    let AUP = {
      mediaTypes: {
        banner: {
          sizes: [[300, 250], [300, 600], [160, 600]],
          responsiveSizes: [
            { sizes: [[300, 250]], minViewPort: [0, 0] },
            { sizes: [[160, 600]], minViewPort: [768, 200] },
            { sizes: [[160, 600], [300, 600]], minViewPort: [1540, 200] }
          ]
        }
      }
    };

    let res = aupSizes.findAUPSizes(AUP);
    // TODO: fill with expects for multiple use cases
  });
});
