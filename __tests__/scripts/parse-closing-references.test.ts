// #888: merging PR #887 closed #882, #883 and #884 as well as #881, because the
// old matcher closed every issue mentioned on a line that held a closing keyword.

const { parseClosingReferences } = require('../../.github/scripts/parse-closing-references.js') as {
  parseClosingReferences: (body: string, repository: { owner: string; repo: string }) => number[]
}

const repository = { owner: 'KovalDenys1', repo: 'Boardly' }

describe('parseClosingReferences', () => {
  it('closes only the reference the keyword precedes', () => {
    expect(parseClosingReferences('Closes #1. Follow-ups: #2, #3', repository)).toEqual([1])
  })

  it('handles the PR body that caused #888', () => {
    const body =
      'Closes #881. Part 1 of 4 of the emoji → brand icons migration ' +
      '(#882 UI chrome, #883 locale strings, #884 guides and misc follow).'

    expect(parseClosingReferences(body, repository)).toEqual([881])
  })

  it('accepts every closing keyword GitHub accepts, in any case', () => {
    const body = ['close #1', 'Closed #2', 'FIXES #3', 'fixed #4', 'Resolve #5', 'resolves: #6'].join('\n')

    expect(parseClosingReferences(body, repository)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('collects one keyword per reference across a multi-issue body', () => {
    const body = 'Closes #10\n\nCloses #12\n\nContext: #14 and #16 stay open.'

    expect(parseClosingReferences(body, repository)).toEqual([10, 12])
  })

  it('keeps same-repository references and drops foreign ones', () => {
    const body = 'Closes KovalDenys1/Boardly#20. Fixes vercel/next.js#21.'

    expect(parseClosingReferences(body, repository)).toEqual([20])
  })

  it('ignores bare references and empty bodies', () => {
    expect(parseClosingReferences('Part of #30, blocks #31.', repository)).toEqual([])
    expect(parseClosingReferences('', repository)).toEqual([])
    expect(parseClosingReferences(null as unknown as string, repository)).toEqual([])
  })
})
