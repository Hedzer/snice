import { controller, respond, IController } from 'snice';

@controller('demo-table-controller')
export class DemoTableController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    this.element = element;
  }

  async detach(_element: HTMLElement) {
  }

  private sampleData = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Developer', salary: 75000, joinDate: '2023-01-15', active: true },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Designer', salary: 68000, joinDate: '2023-03-20', active: true },
    { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'Manager', salary: 95000, joinDate: '2022-11-10', active: false },
    { id: 4, name: 'Alice Brown', email: 'alice.brown@example.com', role: 'Developer', salary: 72000, joinDate: '2023-06-05', active: true },
    { id: 5, name: 'Charlie Wilson', email: 'charlie.wilson@example.com', role: 'QA Engineer', salary: 65000, joinDate: '2023-02-28', active: true },
    { id: 6, name: 'David Lee', email: 'david.lee@example.com', role: 'Developer', salary: 78000, joinDate: '2023-04-12', active: true },
    { id: 7, name: 'Emily Davis', email: 'emily.davis@example.com', role: 'Designer', salary: 70000, joinDate: '2023-05-18', active: false },
    { id: 8, name: 'Frank Miller', email: 'frank.miller@example.com', role: 'Manager', salary: 98000, joinDate: '2022-08-22', active: true }
  ];

  @respond('@snice/table/config')
  async getTableConfig() {
    // Return table configuration
    return {
      columns: [
        { key: 'id', label: 'ID', type: 'number', align: 'right' },
        { key: 'name', label: 'Full Name', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'role', label: 'Role', type: 'text', align: 'center' },
        { key: 'salary', label: 'Salary', type: 'currency', prefix: '$', thousandsSeparator: true, decimals: 0 },
        { key: 'joinDate', label: 'Join Date', type: 'date', dateFormat: 'short' },
        { key: 'active', label: 'Status', type: 'boolean', useSymbols: true, trueSymbol: '✅', falseSymbol: '❌' }
      ],
      selectorOptions: [
        { value: 'Developer', label: 'Developer' },
        { value: 'Designer', label: 'Designer' },
        { value: 'Manager', label: 'Manager' },
        { value: 'QA Engineer', label: 'QA Engineer' }
      ]
    };
  }

  @respond('@snice/table/data')
  async getTableData(params: any) {
    // Add fake delay to see loading skeleton
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let filteredData = [...this.sampleData];
    
    // Apply search filter
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredData = filteredData.filter(row => 
        Object.values(row).some(val => 
          String(val).toLowerCase().includes(searchLower)
        )
      );
    }
    
    // Apply selector filter
    if (params.selector) {
      const selectedRoles = params.selector.split(',');
      filteredData = filteredData.filter(row => 
        selectedRoles.includes(row.role)
      );
    }
    
    // Apply sorting
    if (params.sort && params.sort.length > 0) {
      filteredData.sort((a: any, b: any) => {
        for (const sortItem of params.sort) {
          const aVal = a[sortItem.column];
          const bVal = b[sortItem.column];
          
          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          else if (aVal > bVal) comparison = 1;
          
          if (comparison !== 0) {
            return sortItem.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }
    
    return {
      data: filteredData,
      total: filteredData.length
    };
  }
}