import _ from 'underscore';
import { Integrations, Customers, Segments } from '../../../db/models';
import QueryBuilder from './customerQueryBuilder.js';

export default {
  async customers(root, { params }) {
    const selector = {};

    // Filter by segments
    if (params.segment) {
      const segment = await Segments.findOne({ _id: params.segment });
      const query = QueryBuilder.segments(segment);
      Object.assign(selector, query);
    }

    // filter by brand
    if (params.brand) {
      const integrations = await Integrations.find({ brandId: params.brand });
      selector.integrationId = { $in: integrations.map(i => i._id) };
    }

    // filter by integration
    if (params.integration) {
      const integrations = await Integrations.find({ kind: params.integration });
      /**
       * Since both of brand and integration filters use a same integrationId field
       * we need to intersect two arrays of integration ids.
       */
      const ids = integrations.map(i => i._id);
      const intersectionedIds = selector.integrationId
        ? _.intersection(ids, selector.integrationId.$in)
        : ids;

      selector.integrationId = { $in: intersectionedIds };
    }

    // Filter by tag
    if (params.tag) {
      selector.tagIds = params.tag;
    }

    const sort = { 'messengerData.lastSeenAt': -1 };
    const limit = params.limit || 0;

    return Customers.find(selector)
      .sort(sort)
      .limit(limit);
  },

  /**
   * Publishes customers list for the preview
   * when creating/editing a customer segment
   * @param {Object} segment   Segment that's being created/edited
   * @param {Number} [limit=0] Customers limit (for pagination)
   */
  async customerListForSegmentPreview(root, { segment, limit }) {
    const headSegment = await Segments.findOne({ _id: segment.subOf });

    const query = QueryBuilder.segments(segment, headSegment);
    const sort = { 'messengerData.lastSeenAt': -1 };

    return Customers.find(query)
      .sort(sort)
      .limit(limit);
  },

  customerDetail(root, { _id }) {
    return Customers.findOne({ _id });
  },

  totalCustomersCount() {
    return Customers.find({}).count();
  },

  segments() {
    return Segments.find({});
  },

  headSegments() {
    return Segments.find({ subOf: { $exists: false } });
  },

  segmentDetail(root, { _id }) {
    return Segments.findOne({ _id });
  },
};
