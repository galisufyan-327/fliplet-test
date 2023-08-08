const { pickBy, includes, filter, orderBy, last } = require("lodash")
const sampleData = require('./sample-data.json');

class ORM {
    constructor({ id }) {
        this.id = id
        this.data = sampleData
        this.selected = []
        this.modified = []
        this.selectedAttributes = []
    }

    /**
     *
     * @param {string} dataSet
     * @returns
     */
    select(dataSet) {
        this.selected = this.data?.[dataSet]?.filter(item => item.userId === this.id) ?? [];
        this.selected = this.data?.[dataSet]?.filter(item => item.userId === this.id) ?? [];
        return this;
    }

    /**
     *
     * @param {string[]} attributes
     * @returns
     */
    attributes(attributes) {
        this.modified = attributes.length ? this.modified.map(item => pickBy(item, (_, key) => {
            return includes(attributes, key)
        })) : this.modified
        this.selectedAttributes = attributes
        return this;
    }

    /**
     *
     * @param {Record<string, any>} condition
     */
    where(condition) {
        this.modified = filter(this.selected, condition)
        this.modified = this.attributes(this.selectedAttributes).modified
        return this;
    }

    /**
     *
     * @param {string[]} orders
     * @returns
     */
    order(orders) {
        this.modified = orderBy(this.modified, orders)
        return this;
    }

    findAll() {
        return Promise.resolve(this.modified);
    }

    // FIXME: the findOne method should return first object rather than last but this in intended on the task
    findOne() {
        return Promise.resolve(last(this.modified));
    }

}

const apps = new ORM({
    id: 123
})
const organizations = new ORM({
    id: 123
})

apps
    .select('apps')
    .attributes(['id', 'title'])
    .where({ published: true })
    .order(['title'])
    .findAll()
    .then(res => {
        console.log(res);
    })

organizations
    .select('organizations')
    .attributes(['name'])
    .where({ suspended: false })
    .findOne()
    .then(res => {
        console.log(res);
    })