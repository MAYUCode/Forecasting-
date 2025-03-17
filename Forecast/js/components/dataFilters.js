class DataFilters {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            filters: [],
            onFilterChange: () => {},
            ...options
        };
        this.activeFilters = new Map();
        this.initialize();
    }

    initialize() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const filterHTML = this.options.filters.map(filter => `
            <div class="filter-group">
                <label for="${filter.id}">${filter.label}</label>
                ${this.createFilterInput(filter)}
            </div>
        `).join('');

        this.container.innerHTML = `
            <div class="filters-container">
                ${filterHTML}
                <button id="clearFilters" class="secondary-btn">Clear Filters</button>
            </div>
        `;
    }

    createFilterInput(filter) {
        switch (filter.type) {
            case 'select':
                return `
                    <select id="${filter.id}" class="filter-input">
                        <option value="">All</option>
                        ${filter.options.map(opt => 
                            `<option value="${opt.value}">${opt.label}</option>`
                        ).join('')}
                    </select>
                `;
            case 'date':
                return `
                    <input type="date" id="${filter.id}" class="filter-input">
                `;
            case 'range':
                return `
                    <div class="range-filter">
                        <input type="number" id="${filter.id}_min" 
                            placeholder="Min" class="filter-input">
                        <span>to</span>
                        <input type="number" id="${filter.id}_max" 
                            placeholder="Max" class="filter-input">
                    </div>
                `;
            default:
                return `
                    <input type="text" id="${filter.id}" 
                        placeholder="${filter.placeholder || ''}" class="filter-input">
                `;
        }
    }

    attachEventListeners() {
        this.options.filters.forEach(filter => {
            if (filter.type === 'range') {
                const minInput = document.getElementById(`${filter.id}_min`);
                const maxInput = document.getElementById(`${filter.id}_max`);
                
                minInput.addEventListener('change', () => this.handleFilterChange(filter.id, {
                    min: minInput.value,
                    max: maxInput.value
                }));
                
                maxInput.addEventListener('change', () => this.handleFilterChange(filter.id, {
                    min: minInput.value,
                    max: maxInput.value
                }));
            } else {
                const input = document.getElementById(filter.id);
                input.addEventListener('change', () => 
                    this.handleFilterChange(filter.id, input.value)
                );
            }
        });

        document.getElementById('clearFilters').addEventListener('click', () => 
            this.clearAllFilters()
        );
    }

    handleFilterChange(filterId, value) {
        if (value === '' || 
            (typeof value === 'object' && !value.min && !value.max)) {
            this.activeFilters.delete(filterId);
        } else {
            this.activeFilters.set(filterId, value);
        }

        this.options.onFilterChange(this.getActiveFilters());
    }

    getActiveFilters() {
        const filters = {};
        this.activeFilters.forEach((value, key) => {
            filters[key] = value;
        });
        return filters;
    }

    clearAllFilters() {
        this.activeFilters.clear();
        this.options.filters.forEach(filter => {
            if (filter.type === 'range') {
                document.getElementById(`${filter.id}_min`).value = '';
                document.getElementById(`${filter.id}_max`).value = '';
            } else {
                document.getElementById(filter.id).value = '';
            }
        });
        this.options.onFilterChange({});
    }
} 