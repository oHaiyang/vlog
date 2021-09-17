import React from 'react';
import {
  EditableText,
  Navbar,
  Text,
  Tabs,
  Tab,
  IconSize,
  Colors,
  Icon,
  Intent,
  Spinner,
} from '@blueprintjs/core';

function Nav() {
  return (
    <Navbar className="flex-shrink-0">
      <Navbar.Group>
        <Navbar.Heading className="flex items-center">
          <EditableText defaultValue="" onConfirm={() => {}} />
          <Icon
            icon="edit"
            color={Colors.GRAY5}
            className="ml-2"
            iconSize={IconSize.LARGE}
            style={{ animation: 'wiggle-rotate 120ms 100ms 15' }}
          />
        </Navbar.Heading>
        <Text className="text-gray-500">"example_file_name"</Text>
        <Navbar.Divider />
      </Navbar.Group>
      <Navbar.Group>
        <Tabs
          id="log_files"
          selectedTabId="only"
          large={true}
          onChange={(newTabId: string) => {
          }}
        >
          <Tab key="only" id="only" className="flex">
            {"only"}{' '}
            {false && <Spinner
              className="ml-2"
              size={14}
              intent={Intent.PRIMARY}
              tagName="span"
              value={1}
            />}
          </Tab>
        </Tabs>
      </Navbar.Group>
    </Navbar>
  );
}

export default Nav;

