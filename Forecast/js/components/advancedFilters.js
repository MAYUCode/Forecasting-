class AdvancedFilters {
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
        this.initializeFilterLogic();
    }

    render() {
        this.container.innerHTML = `
            <div class="advanced-filters">
                <div class="filter-builder">
                    <div class="filter-groups" id="filterGroups">
                        ${this.renderFilterGroups()}
                    </div>
                    <button class="add-filter-btn" id="addFilterGroup">
                        Add Filter Group
                    </button>
                </div>
                <div class="filter-actions">
                    <button class="apply-filters-btn" id="applyFilters">
                        Apply Filters
                    </button>
                    <button class="clear-filters-btn" id="clearFilters">
                        Clear All
                    </button>
                </div>
            </div>
        `;
    }

    renderFilterGroups() {
        return `
            <div class="filter-group" data-group-id="1">
                <div class="filter-group-header">
                    <select class="condition-select">
                        <option value="and">AND</option>
                        <option value="or">OR</option>
                    </select>
                    <button class="remove-group-btn">×</button>
                </div>
                <div class="filter-conditions">
                    ${this.renderFilterCondition()}
                </div>
                <button class="add-condition-btn">Add Condition</button>
            </div>
        `;
    }

    renderFilterCondition() {
        return `
            <div class="filter-condition">
                <select class="field-select">
                    ${this.options.filters.map(filter => `
                        <option value="${filter.id}">${filter.label}</option>
                    `).join('')}
                </select>
                <select class="operator-select">
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greater">Greater Than</option>
                    <option value="less">Less Than</option>
                    <option value="between">Between</option>
                </select>
                <div class="value-container">
                    <input type="text" class="value-input" placeholder="Value">
                </div>
                <button class="remove-condition-btn">×</button>
            </div>
        `;
    }

    initializeFilterLogic() {
        this.container.addEventListener('click', (e) => {
            if (e.target.matches('.add-filter-btn')) {
                this.addFilterGroup();
            } else if (e.target.matches('.add-condition-btn')) {
                this.addFilterCondition(e.target.closest('.filter-group'));
            } else if (e.target.matches('.remove-group-btn')) {
                this.removeFilterGroup(e.target.closest('.filter-group'));
            } else if (e.target.matches('.remove-condition-btn')) {
                this.removeFilterCondition(e.target.closest('.filter-condition'));
            }
        });

        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });
    }

    addFilterGroup() {
        const filterGroups = document.getElementById('filterGroups');
        const newGroup = document.createElement('div');
        newGroup.innerHTML = this.renderFilterGroups();
        filterGroups.appendChild(newGroup.firstElementChild);
    }

    addFilterCondition(group) {
        const conditions = group.querySelector('.filter-conditions');
        const newCondition = document.createElement('div');
        newCondition.innerHTML = this.renderFilterCondition();
        conditions.appendChild(newCondition.firstElementChild);
    }

    removeFilterGroup(group) {
        if (document.querySelectorAll('.filter-group').length > 1) {
            group.remove();
        }
    }

    removeFilterCondition(condition) {
        const group = condition.closest('.filter-group');
        if (group.querySelectorAll('.filter-condition').length > 1) {
            condition.remove();
        }
    }

    applyFilters() {
        const filters = this.collectFilters();
        this.options.onFilterChange(filters);
    }

    clearFilters() {
        const filterGroups = document.getElementById('filterGroups');
        filterGroups.innerHTML = this.renderFilterGroups();
        this.options.onFilterChange({});
    }

    collectFilters() {
        const filters = [];
        document.querySelectorAll('.filter-group').forEach(group => {
            const groupCondition = group.querySelector('.condition-select').value;
            const conditions = [];
            
            group.querySelectorAll('.filter-condition').forEach(condition => {
                conditions.push({
                    field: condition.querySelector('.field-select').value,
                    operator: condition.querySelector('.operator-select').value,
                    value: condition.querySelector('.value-input').value
                });
            });

            filters.push({
                condition: groupCondition,
                filters: conditions
            });
        });

        return filters;
    }
} 