/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  ResolverTree,
  ResolverNodeStats,
  ResolverLifecycleNode,
  SafeResolverEvent,
  NewResolverTree,
  ResolverNode,
  EventStats,
  ResolverSchema,
} from '../../../common/endpoint/types';
import * as nodeModel from '../../../common/endpoint/models/node';
import { IndexedProcessTree } from '../types';
import { calculateGenerations } from '../lib/tree_sequencers';

/**
 * Given an indexedProcessTree, we will walk the tree via DFS and calculate the number of generations
 * beginning with the origin
 */
export function originDescendantGenerationCount(tree: IndexedProcessTree) {
  if (tree.originID) {
    return calculateGenerations<string | undefined, ResolverNode>(
      tree.originID,
      0,
      (parentID: string | undefined): ResolverNode[] => {
        const currentSiblings = tree.idToChildren.get(parentID);
        return currentSiblings === undefined ? [] : currentSiblings;
      }
    );
  }
}

export function ancestorRequestAmount(schema: ResolverSchema): number {
  const withAncestryField = 200;
  const withoutAncestryField = 20;

  return schema.ancestry ? withAncestryField : withoutAncestryField;
}

export function generationRequestAmount(schema: ResolverSchema): number {
  const withAncestryField = 1000;
  const withoutAncestryField = 10;

  return schema.ancestry ? withAncestryField : withoutAncestryField;
}
/**
 * This returns a map of nodeIDs to the associated stats provided by the datasource.
 */
export function nodeStats(tree: NewResolverTree): Map<ResolverNode['id'], EventStats> {
  const stats = new Map();

  for (const node of tree.nodes) {
    if (node.stats) {
      const nodeID = nodeModel.nodeID(node);
      stats.set(nodeID, node.stats);
    }
  }
  return stats;
}

/**
 * ResolverTree is a type returned by the server.
 */

/**
 * This returns the 'LifecycleNodes' of the tree. These nodes have
 * the entityID and stats for a process. Used by `relatedEventsStats`.
 *
 * @deprecated use indexed_process_tree instead
 */
function lifecycleNodes(tree: ResolverTree): ResolverLifecycleNode[] {
  return [tree, ...tree.children.childNodes, ...tree.ancestry.ancestors];
}

/**
 * All the process events
 *
 * @deprecated use nodeData instead
 */
export function lifecycleEvents(tree: ResolverTree) {
  const events: SafeResolverEvent[] = [...tree.lifecycle];
  for (const { lifecycle } of tree.children.childNodes) {
    events.push(...lifecycle);
  }
  for (const { lifecycle } of tree.ancestry.ancestors) {
    events.push(...lifecycle);
  }
  return events;
}

/**
 * This returns a map of entity_ids to stats for the related events and alerts.
 *
 * @deprecated use indexed_process_tree instead
 */
export function relatedEventsStats(tree: ResolverTree): Map<string, ResolverNodeStats> {
  const nodeRelatedEventStats: Map<string, ResolverNodeStats> = new Map();
  for (const node of lifecycleNodes(tree)) {
    if (node.stats) {
      nodeRelatedEventStats.set(node.entityID, node.stats);
    }
  }
  return nodeRelatedEventStats;
}

/**
 * ResolverTree type is returned by the server. It organizes events into a complex structure. The
 * organization of events in the tree is done to associate metadata with the events. The client does not
 * use this metadata. Instead, the client flattens the tree into an array. Therefore we can safely
 * make a malformed ResolverTree for the purposes of the tests, so long as it is flattened in a predictable way.
 */
export function mock({
  nodes,
}: {
  /**
   * Events represented by the ResolverTree.
   */
  nodes: ResolverNode[];
}): NewResolverTree | null {
  if (nodes.length === 0) {
    return null;
  }
  const originNode = nodes[0];
  const originID = nodeModel.nodeID(originNode);
  if (!originID) {
    throw new Error('first mock event must include an nodeID.');
  }
  return {
    originID,
    nodes,
  };
}
