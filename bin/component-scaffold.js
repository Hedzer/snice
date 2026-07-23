export function generateComponentSource({
  name,
  properties = [],
  withStyles = true,
  withEvents = []
}) {
  if (typeof name !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/.test(name)) {
    throw new TypeError('name must be a lowercase custom-element name containing a hyphen');
  }

  const className = name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
  const typeMap = { string: 'String', number: 'Number', boolean: 'Boolean', array: 'Array', object: 'Object' };
  const defaults = { string: "''", number: '0', boolean: 'false', array: '[]', object: '{}' };
  const propertyLines = properties.map(property => {
    if (!/^[A-Za-z_$][\w$]*$/.test(property.name)) throw new TypeError(`invalid property name: ${property.name}`);
    const type = typeMap[property.type] ? property.type : 'string';
    const initial = property.default ?? defaults[type];
    return `  @property({ type: ${typeMap[type]} }) ${property.name} = ${initial};`;
  }).join('\n');
  const eventMethods = withEvents.map(eventName => {
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(eventName)) {
      throw new TypeError(`invalid event name: ${eventName}`);
    }
    const method = eventName.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
    return `\n  @dispatch('${eventName}')\n  emit${method}(detail?: unknown) {\n    return detail;\n  }`;
  }).join('\n');
  const imports = ['element', 'property', 'render', 'html'];
  if (withStyles) imports.push('styles', 'css');
  if (withEvents.length) imports.push('dispatch');

  return `import { ${imports.join(', ')} } from 'snice';

@element('${name}')
export class ${className} extends HTMLElement {
${propertyLines}${propertyLines ? '\n' : ''}${withStyles ? `
  @styles()
  componentStyles() {
    return css\`
      :host {
        display: block;
      }
    \`;
  }
` : ''}
  @render()
  template() {
    return html\`<slot></slot>\`;
  }${eventMethods}
}
`;
}
