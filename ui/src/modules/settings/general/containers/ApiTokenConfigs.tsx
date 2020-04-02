import gql from 'graphql-tag';
import * as compose from 'lodash.flowright';
import Spinner from 'modules/common/components/Spinner';
import { Alert, withProps } from 'modules/common/utils';
import React from 'react';
import { graphql } from 'react-apollo';
import ApiTokenConfig from '../components/ApiTokenConfigs';
import { mutations, queries } from '../graphql';
import { IConfigsMap } from '../types';

type FinalProps = {
  fetchApiQuery;
  updateConfigs: (configsMap: IConfigsMap) => Promise<void>;
};

class ConfigContainer extends React.Component<FinalProps> {
  render() {
    const { updateConfigs, fetchApiQuery } = this.props;

    if (fetchApiQuery.loading) {
      return <Spinner objective={true} />;
    }

    // create or update action
    const save = (map: IConfigsMap) => {
      updateConfigs({
        variables: { configsMap: map }
      })
        .then(() => {
          fetchApiQuery.refetch();

          Alert.success('You successfully updated general settings');
        })
        .catch(error => {
          Alert.error(error.message);
        });
    };

    const configs = (fetchApiQuery.configs || []).filter(item =>
      ['API_KEY', 'API_TOKEN'].includes(item.code)
    );

    const configsMap = {};

    for (const config of configs) {
      configsMap[config.code] = config.value;
    }

    return (
      <ApiTokenConfig {...this.props} configsMap={configsMap} save={save} />
    );
  }
}

export default withProps<{}>(
  compose(
    graphql<{}>(gql(queries.configs), {
      name: 'fetchApiQuery',
      options: () => ({
        variables: {
          path: '/configs',
          params: {}
        }
      })
    }),
    graphql<{}>(gql(mutations.updateConfigs), {
      name: 'updateConfigs'
    })
  )(ConfigContainer)
);
