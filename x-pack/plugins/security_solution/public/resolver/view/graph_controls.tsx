/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

/* eslint-disable react/display-name */
/* eslint-disable react/button-has-type */

import React, { useCallback, useMemo, useContext, useState, HTMLAttributes } from 'react';
import styled from 'styled-components';
import { i18n } from '@kbn/i18n';
import {
  EuiRange,
  EuiPanel,
  EuiIcon,
  EuiButtonIcon,
  EuiPopover,
  EuiPopoverTitle,
  EuiIconTip,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';
import { useSelector, useDispatch } from 'react-redux';
import { SideEffectContext } from './side_effect_context';
import { Vector2 } from '../types';
import * as selectors from '../store/selectors';
import { ResolverAction } from '../store/actions';
import { useColors } from './use_colors';
import { StyledDescriptionList } from './panels/styles';
import { CubeForProcess } from './panels/cube_for_process';
import { GeneratedText } from './generated_text';

interface StyledGraphControlProps {
  $backgroundColor: string;
  $iconColor: string;
  $borderColor: string;
}

const StyledGraphControlsColumn = styled.div`
  display: flex;
  flex-direction: column;

  &:not(last-of-type) {
    margin-right: 5px;
  }
`;

const StyledEuiDescriptionListTitle = styled(EuiDescriptionListTitle)`
  text-transform: uppercase;
  max-width: 25%;
`;

const StyledEuiDescriptionListDescription = styled(EuiDescriptionListDescription)`
  min-width: 75%;
  width: 75%;
`;

const StyledEuiButtonIcon = styled(EuiButtonIcon)<StyledGraphControlProps>`
  background-color: ${(props) => props.$backgroundColor};
  color: ${(props) => props.$iconColor};
  border-color: ${(props) => props.$borderColor};
  border-width: 1px;
  border-style: solid;
  border-radius: 4px;
  width: 40px;
  height: 40px;

  &:not(last-of-type) {
    margin-bottom: 7px;
  }
`;

const StyledGraphControls = styled.div<Partial<StyledGraphControlProps>>`
  display: flex;
  flex-direction: row;
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: transparent;
  color: ${(props) => props.$iconColor};

  .zoom-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 5px 0px;

    .zoom-slider {
      width: 20px;
      height: 150px;
      margin: 5px 0px 2px 0px;

      input[type='range'] {
        width: 150px;
        height: 20px;
        transform-origin: 75px 75px;
        transform: rotate(-90deg);
      }
    }
  }
  .panning-controls {
    text-align: center;
  }
`;
/**
 * Controls for zooming, panning, and centering in Resolver
 */

export const GraphControls = React.memo(
  ({
    className,
  }: {
    /**
     * A className string provided by `styled`
     */
    className?: string;
  }) => {
    const dispatch: (action: ResolverAction) => unknown = useDispatch();
    const scalingFactor = useSelector(selectors.scalingFactor);
    const { timestamp } = useContext(SideEffectContext);
    const [activePopover, setPopover] = useState<null | 'schemaInfo' | 'nodesLegend'>(null);
    const colorMap = useColors();

    const setActivePopover = useCallback(
      (value) => {
        if (value === activePopover) {
          setPopover(null);
        } else {
          setPopover(value);
        }
      },
      [setPopover, activePopover]
    );

    const closePopover = useCallback(() => setPopover(null), []);

    const handleZoomAmountChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
        const valueAsNumber = parseFloat(
          (event as React.ChangeEvent<HTMLInputElement>).target.value
        );
        if (isNaN(valueAsNumber) === false) {
          dispatch({
            type: 'userSetZoomLevel',
            payload: valueAsNumber,
          });
        }
      },
      [dispatch]
    );

    const handleCenterClick = useCallback(() => {
      dispatch({
        type: 'userSetPositionOfCamera',
        payload: [0, 0],
      });
    }, [dispatch]);

    const handleZoomOutClick = useCallback(() => {
      dispatch({
        type: 'userClickedZoomOut',
      });
    }, [dispatch]);

    const handleZoomInClick = useCallback(() => {
      dispatch({
        type: 'userClickedZoomIn',
      });
    }, [dispatch]);

    const [handleNorth, handleEast, handleSouth, handleWest] = useMemo(() => {
      const directionVectors: readonly Vector2[] = [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ];
      return directionVectors.map((direction) => {
        return () => {
          const action: ResolverAction = {
            type: 'userNudgedCamera',
            payload: { direction, time: timestamp() },
          };
          dispatch(action);
        };
      });
    }, [dispatch, timestamp]);

    return (
      <StyledGraphControls
        className={className}
        $iconColor={colorMap.graphControls}
        data-test-subj="resolver:graph-controls"
      >
        <StyledGraphControlsColumn>
          <SchemaInformation
            closePopover={closePopover}
            isOpen={activePopover === 'schemaInfo'}
            setActivePopover={setActivePopover}
          />
          <CubeLegend
            closePopover={closePopover}
            isOpen={activePopover === 'nodesLegend'}
            setActivePopover={setActivePopover}
          />
        </StyledGraphControlsColumn>
        <StyledGraphControlsColumn>
          <EuiPanel className="panning-controls" paddingSize="none" hasShadow>
            <div className="panning-controls-top">
              <button
                className="north-button"
                data-test-subj="resolver:graph-controls:north-button"
                title={i18n.translate('xpack.securitySolution.resolver.graphControls.north', {
                  defaultMessage: 'North',
                })}
                onClick={handleNorth}
              >
                <EuiIcon type="arrowUp" />
              </button>
            </div>
            <div className="panning-controls-middle">
              <button
                className="west-button"
                data-test-subj="resolver:graph-controls:west-button"
                title={i18n.translate('xpack.securitySolution.resolver.graphControls.west', {
                  defaultMessage: 'West',
                })}
                onClick={handleWest}
              >
                <EuiIcon type="arrowLeft" />
              </button>
              <button
                className="center-button"
                data-test-subj="resolver:graph-controls:center-button"
                title={i18n.translate('xpack.securitySolution.resolver.graphControls.center', {
                  defaultMessage: 'Center',
                })}
                onClick={handleCenterClick}
              >
                <EuiIcon type="bullseye" />
              </button>
              <button
                className="east-button"
                data-test-subj="resolver:graph-controls:east-button"
                title={i18n.translate('xpack.securitySolution.resolver.graphControls.east', {
                  defaultMessage: 'East',
                })}
                onClick={handleEast}
              >
                <EuiIcon type="arrowRight" />
              </button>
            </div>
            <div className="panning-controls-bottom">
              <button
                className="south-button"
                data-test-subj="resolver:graph-controls:south-button"
                title={i18n.translate('xpack.securitySolution.resolver.graphControls.south', {
                  defaultMessage: 'South',
                })}
                onClick={handleSouth}
              >
                <EuiIcon type="arrowDown" />
              </button>
            </div>
          </EuiPanel>
          <EuiPanel className="zoom-controls" paddingSize="none" hasShadow>
            <button
              title={i18n.translate('xpack.securitySolution.resolver.graphControls.zoomIn', {
                defaultMessage: 'Zoom In',
              })}
              data-test-subj="resolver:graph-controls:zoom-in"
              onClick={handleZoomInClick}
            >
              <EuiIcon type="plusInCircle" />
            </button>
            <EuiRange
              className="zoom-slider"
              data-test-subj="resolver:graph-controls:zoom-slider"
              min={0}
              max={1}
              step={0.01}
              value={scalingFactor}
              onChange={handleZoomAmountChange}
            />
            <button
              title={i18n.translate('xpack.securitySolution.resolver.graphControls.zoomOut', {
                defaultMessage: 'Zoom Out',
              })}
              data-test-subj="resolver:graph-controls:zoom-out"
              onClick={handleZoomOutClick}
            >
              <EuiIcon type="minusInCircle" />
            </button>
          </EuiPanel>
        </StyledGraphControlsColumn>
      </StyledGraphControls>
    );
  }
);

const SchemaInformation = ({
  closePopover,
  setActivePopover,
  isOpen,
}: {
  closePopover: () => void;
  setActivePopover: (value: 'schemaInfo' | null) => void;
  isOpen: boolean;
}) => {
  const colorMap = useColors();
  const sourceAndSchema = useSelector(selectors.resolverTreeSourceAndSchema);
  const setAsActivePopover = useCallback(() => setActivePopover('schemaInfo'), [setActivePopover]);

  const schemaInfoButtonTitle = i18n.translate(
    'xpack.securitySolution.resolver.graphControls.schemaInfoButtonTitle',
    {
      defaultMessage: 'Schema Information',
    }
  );

  const unknownSchemaValue = i18n.translate(
    'xpack.securitySolution.resolver.graphControls.unknownSchemaValue',
    {
      defaultMessage: 'Unknown',
    }
  );

  return (
    <EuiPopover
      ownFocus
      onScroll={closePopover}
      repositionOnScroll={false}
      onClick={setAsActivePopover}
      button={
        <StyledEuiButtonIcon
          size="m"
          title={schemaInfoButtonTitle}
          aria-label={schemaInfoButtonTitle}
          iconType="iInCircle"
          $backgroundColor={colorMap.graphControlsBackground}
          $iconColor={colorMap.graphControls}
          $borderColor={colorMap.graphControlsBorderColor}
        />
      }
      isOpen={isOpen}
      closePopover={closePopover}
      anchorPosition="leftCenter"
    >
      <EuiPopoverTitle style={{ textTransform: 'uppercase' }}>
        {i18n.translate('xpack.securitySolution.resolver.graphControls.schemaInfoTitle', {
          defaultMessage: 'process tree',
        })}
        <EuiIconTip
          content={i18n.translate(
            'xpack.securitySolution.resolver.graphControls.schemaInfoTooltip',
            {
              defaultMessage: 'These are the fields used to create the process tree',
            }
          )}
          position="right"
        />
      </EuiPopoverTitle>
      <div
        // Limit the width based on UX design
        style={{ maxWidth: '256px' }}
      >
        <StyledDescriptionList
          data-test-subj="resolver:schema-info"
          type="column"
          align="left"
          titleProps={
            {
              'data-test-subj': 'resolver:schema-info:title',
              style: { width: '30%' },
              // Casting this to allow data attribute
            } as HTMLAttributes<HTMLElement>
          }
          descriptionProps={
            {
              'data-test-subj': 'resolver:schema-info:description',
              style: { width: '70%' },
            } as HTMLAttributes<HTMLElement>
          }
          compressed
        >
          <>
            <StyledEuiDescriptionListTitle>
              {i18n.translate('xpack.securitySolution.resolver.graphControls.schemaSource', {
                defaultMessage: 'source',
              })}
            </StyledEuiDescriptionListTitle>
            <StyledEuiDescriptionListDescription>
              <GeneratedText>{sourceAndSchema?.dataSource ?? unknownSchemaValue}</GeneratedText>
            </StyledEuiDescriptionListDescription>
            <StyledEuiDescriptionListTitle>
              {i18n.translate('xpack.securitySolution.resolver.graphControls.schemaID', {
                defaultMessage: 'id',
              })}
            </StyledEuiDescriptionListTitle>
            <StyledEuiDescriptionListDescription>
              <GeneratedText>{sourceAndSchema?.schema.id ?? unknownSchemaValue}</GeneratedText>
            </StyledEuiDescriptionListDescription>
            <StyledEuiDescriptionListTitle>
              {i18n.translate('xpack.securitySolution.resolver.graphControls.schemaEdge', {
                defaultMessage: 'edge',
              })}
            </StyledEuiDescriptionListTitle>
            <StyledEuiDescriptionListDescription>
              <GeneratedText>{sourceAndSchema?.schema.parent ?? unknownSchemaValue}</GeneratedText>
            </StyledEuiDescriptionListDescription>
          </>
        </StyledDescriptionList>
      </div>
    </EuiPopover>
  );
};

const CubeLegend = ({
  closePopover,
  setActivePopover,
  isOpen,
}: {
  closePopover: () => void;
  setActivePopover: (value: 'nodesLegend') => void;
  isOpen: boolean;
}) => {
  // This component defines the cube legend that allows users to identify the meaning of the cubes
  // Should be updated to be dynamic if and when non process based resolvers are possible
  const setAsActivePopover = useCallback(() => setActivePopover('nodesLegend'), [setActivePopover]);
  const colorMap = useColors();

  const nodesLegendButtonTitle = i18n.translate(
    'xpack.securitySolution.resolver.graphControls.nodesLegendButtonTitle',
    {
      defaultMessage: 'Nodes Legend',
    }
  );

  return (
    <EuiPopover
      ownFocus
      button={
        <StyledEuiButtonIcon
          size="m"
          title={nodesLegendButtonTitle}
          aria-label={nodesLegendButtonTitle}
          iconType="node"
          $backgroundColor={colorMap.graphControlsBackground}
          $iconColor={colorMap.graphControls}
          $borderColor={colorMap.graphControlsBorderColor}
        />
      }
      onScroll={closePopover}
      repositionOnScroll={false}
      onClick={setAsActivePopover}
      isOpen={isOpen}
      closePopover={closePopover}
      anchorPosition="leftCenter"
    >
      <EuiPopoverTitle style={{ textTransform: 'uppercase' }}>
        {i18n.translate('xpack.securitySolution.resolver.graphControls.nodeLegend', {
          defaultMessage: 'legend',
        })}
      </EuiPopoverTitle>
      <div
        // Limit the width based on UX design
        style={{ maxWidth: '212px' }}
      >
        <StyledDescriptionList
          data-test-subj="resolver:graph-controls:legend"
          type="column"
          align="left"
          titleProps={
            {
              'data-test-subj': 'resolver:graph-controls:legend:title',
              className: 'legend-desc-title',
              style: { width: '20%' },
              // Casting this to allow data attribute
            } as HTMLAttributes<HTMLElement>
          }
          descriptionProps={
            {
              'data-test-subj': 'resolver:graph-controls:legend:description',
              className: 'legend-description',
              style: { width: '80%', lineHeight: '2.2em' }, // lineHeight to align center vertically
            } as HTMLAttributes<HTMLElement>
          }
          compressed
        >
          <>
            <StyledEuiDescriptionListTitle>
              <CubeForProcess
                size="2.5em"
                data-test-subj="resolver:node-detail:title-icon"
                state="running"
              />
            </StyledEuiDescriptionListTitle>
            <StyledEuiDescriptionListDescription>
              <GeneratedText>
                {i18n.translate(
                  'xpack.securitySolution.resolver.graphControls.runningProcessCube',
                  {
                    defaultMessage: 'Running Process',
                  }
                )}
              </GeneratedText>
            </StyledEuiDescriptionListDescription>
            <StyledEuiDescriptionListTitle>
              <CubeForProcess
                size="2.5em"
                data-test-subj="resolver:node-detail:title-icon"
                state="terminated"
              />
            </StyledEuiDescriptionListTitle>
            <StyledEuiDescriptionListDescription>
              <GeneratedText>
                {i18n.translate(
                  'xpack.securitySolution.resolver.graphControls.terminatedProcessCube',
                  {
                    defaultMessage: 'Terminated Process',
                  }
                )}
              </GeneratedText>
            </StyledEuiDescriptionListDescription>
            <StyledEuiDescriptionListTitle>
              <CubeForProcess
                size="2.5em"
                data-test-subj="resolver:node-detail:title-icon"
                state="loading"
              />
            </StyledEuiDescriptionListTitle>
            <StyledEuiDescriptionListDescription>
              <GeneratedText>
                {i18n.translate(
                  'xpack.securitySolution.resolver.graphControls.currentlyLoadingCube',
                  {
                    defaultMessage: 'Loading Process',
                  }
                )}
              </GeneratedText>
            </StyledEuiDescriptionListDescription>
            <StyledEuiDescriptionListTitle>
              <CubeForProcess
                size="2.5em"
                data-test-subj="resolver:node-detail:title-icon"
                state="error"
              />
            </StyledEuiDescriptionListTitle>
            <StyledEuiDescriptionListDescription>
              <GeneratedText>
                {i18n.translate('xpack.securitySolution.resolver.graphControls.errorCube', {
                  defaultMessage: 'Error',
                })}
              </GeneratedText>
            </StyledEuiDescriptionListDescription>
          </>
        </StyledDescriptionList>
      </div>
    </EuiPopover>
  );
};
