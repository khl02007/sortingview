import React, { Fragment, FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';
import SortingUnitPlotGrid from '../../../commonComponents/SortingUnitPlotGrid/SortingUnitPlotGrid';
import Splitter from 'figurl/labbox-react/components/Splitter/Splitter';
import { SortingViewProps } from '../../../pluginInterface';
import AverageWaveformView from './AverageWaveformView';
import { ActionItem, DividerItem } from '../../common/Toolbars';
import { useRecordingInfo } from 'python/sortingview/gui/pluginInterface/useRecordingInfo';
import ViewToolbar from '../../common/ViewToolbar';
import { IconButton } from '@material-ui/core';
import { useVisible } from 'figurl/labbox-react';
import { Help } from '@material-ui/icons';
import MarkdownDialog from 'figurl/labbox-react/components/Markdown/MarkdownDialog';
import info from '../../../helpPages/AverageWaveforms.md.gen'

export type AverageWaveformAction = ActionItem  | DividerItem


const TOOLBAR_INITIAL_WIDTH = 36 // hard-coded for now

const AverageWaveformsView: FunctionComponent<SortingViewProps> = (props) => {
    const {recording, sorting, curation, selection, selectionDispatch, width=600, height=650, snippetLen, sortingSelector} = props
    const recordingInfo = useRecordingInfo(recording.recordingPath)
    const boxHeight = 250
    const boxWidth = 180
    const noiseLevel = (recordingInfo || {}).noise_level || 1  // fix this
    const [scalingActions, setScalingActions] = useState<AverageWaveformAction[] | null>(null)
    const unitComponent = useMemo(() => (unitId: number) => (
        <AverageWaveformView
            {...{sorting, curation, recording, unitId, selection, selectionDispatch}}
            width={boxWidth}
            height={boxHeight}
            noiseLevel={noiseLevel}
            customActions={scalingActions || []}
            snippetLen={snippetLen}
        />
    ), [sorting, recording, selection, selectionDispatch, noiseLevel, scalingActions, curation, snippetLen])

    const _handleScaleAmplitudeUp = useCallback(() => {
        selectionDispatch({type: 'ScaleAmpScaleFactor', direction: 'up'})
    }, [selectionDispatch])
    const _handleScaleAmplitudeDown = useCallback(() => {
        selectionDispatch({type: 'ScaleAmpScaleFactor', direction: 'down'})
    }, [selectionDispatch])

    useEffect(() => {
        const actions: AverageWaveformAction[] = [
            {
                type: 'button',
                callback: _handleScaleAmplitudeUp,
                title: 'Scale amplitude up [up arrow]',
                icon: <FaArrowUp />,
                keyCode: 38
            },
            {
                type: 'button',
                callback: _handleScaleAmplitudeDown,
                title: 'Scale amplitude down [down arrow]',
                icon: <FaArrowDown />,
                keyCode: 40
            }
        ]
        setScalingActions(actions)
    }, [_handleScaleAmplitudeUp, _handleScaleAmplitudeDown])

    const infoVisible = useVisible()

    return width ? (
        <div>
            <Splitter
                width={width}
                height={height}
                initialPosition={TOOLBAR_INITIAL_WIDTH}
                adjustable={false}
            >
                {
                    <ViewToolbar
                        width={TOOLBAR_INITIAL_WIDTH}
                        height={height}
                        customActions={scalingActions}
                    />
                }
                {
                    <Fragment>
                        <div>
                            <IconButton onClick={infoVisible.show}><Help /></IconButton>
                        </div>
                        <SortingUnitPlotGrid
                            sorting={sorting}
                            selection={selection}
                            curation={curation}
                            selectionDispatch={selectionDispatch}
                            unitComponent={unitComponent}
                            sortingSelector={sortingSelector}
                        />
                        <MarkdownDialog
                            visible={infoVisible.visible}
                            onClose={infoVisible.hide}
                            source={info}
                        />
                    </Fragment>
                }
            </Splitter>
        </div>
    )
    : (<div>No width</div>);
}

export default AverageWaveformsView