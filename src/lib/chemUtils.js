import SmilesDrawer from 'smiles-drawer'

// Detect whether input is a SMILES string or a common name
// SMILES contain chemistry symbols: = # @ + - [ ] ( ) digits \ /
export function isSmilesString(input) {
  return /[=#@+\[\]\\\/\d]/.test(input.trim()) || input.includes('(')
}

// Convert a common chemical name to SMILES via PubChem
// Throws if the compound is not found
export async function nameToSmiles(name) {
  const encoded = encodeURIComponent(name.trim())
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/IsomericSMILES/JSON`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Compound "${name}" not found in PubChem`)
  const data = await res.json()
  return data.PropertyTable.Properties[0].IsomericSMILES
}

// Convert a SMILES string to a base64-encoded SVG data URL
// Returns a Promise<string> — the data:image/svg+xml;base64,... URL
export function smilesToSvgDataUrl(smilesString) {
  return new Promise((resolve, reject) => {
    const drawer = new SmilesDrawer.SvgDrawer({
      width: 400,
      height: 300,
      bondThickness: 1.2,
      fontSizeLarge: 14,
      fontSizeSmall: 10,
      backgroundColor: 'transparent',
    })

    SmilesDrawer.parse(smilesString, (tree) => {
      try {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        drawer.draw(tree, svg, 'light')
        const svgString = new XMLSerializer().serializeToString(svg)
        const base64 = btoa(unescape(encodeURIComponent(svgString)))
        resolve(`data:image/svg+xml;base64,${base64}`)
      } catch (err) {
        reject(err)
      }
    }, (err) => reject(new Error(`Invalid SMILES: ${err}`)))
  })
}

// Full pipeline: input (name or SMILES) → base64 SVG data URL
// Handles name lookup automatically
export async function inputToSvgDataUrl(input) {
  const smiles = isSmilesString(input)
    ? input.trim()
    : await nameToSmiles(input)
  return smilesToSvgDataUrl(smiles)
}
