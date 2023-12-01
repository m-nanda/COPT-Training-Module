import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Tooltip,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import { Build, CloudDownload, ExpandMore, Refresh } from '@material-ui/icons';
import {
  changeSootblow,
  exportSootblowAlarmHistory,
  getAlarmHistory,
  getAlarmHistoryByID,
  updateAlarmHistoryData,
} from 'app/store/actions';
import React, { useEffect, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useDispatch, useSelector } from 'react-redux';
import clsx from 'clsx';
import { showMessage } from 'app/store/fuse/messageSlice';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Confirmation from 'app/fuse-layouts/shared-components/Confirmation';
import DateRangeModal from 'app/fuse-layouts/shared-components/DateRangeModal';
import moment from 'moment';
import { useMediaQuery } from '@fuse/hooks';

const Accordion = withStyles({
  root: {
    border: '1px solid rgba(0, 0, 0, .125)',
    boxShadow: 'none',
    '&:not(:last-child)': {
      borderBottom: 0,
    },
    '&:before': {
      display: 'none',
    },
    '&$expanded': {
      margin: 'auto',
    },
  },
  expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
  root: {
    backgroundColor: 'rgba(0, 0, 0, .03)',
    borderBottom: '1px solid rgba(0, 0, 0, .125)',
    marginBottom: -1,
    minHeight: 56,
    '&$expanded': {
      minHeight: 56,
    },
  },
  content: {
    '&$expanded': {
      margin: '0',
    },
  },
  expanded: {},
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiAccordionDetails);

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  heading: {
    fontWeight: theme.typography.fontWeightRegular,
  },
  formControl: {
    minWidth: '100%',
  },
  saveButton: {
    backgroundColor: '#1976d2',
    color: '#FFF',
    '&:hover': {
      backgroundColor: '#21619e',
    },
  },
  container: {
    maxHeight: '100%',
  },
  defaultButton: {
    padding: '0px 8px',
  },
  errorAlert: {
    backgroundColor: theme.palette.error.dark,
    color: theme.palette.getContrastText(theme.palette.error.dark),
  },
}));

const createAlarmData = (alarmId, date, setValue, actualValue, desc) => {
  return { alarmId, date, setValue, actualValue, desc };
};

const AlarmHistory = ({ expanded, handleChange }) => {
  const classes = useStyles();

  const sootblowReducer = useSelector((state) => state.sootblowReducer);
  const dispatch = useDispatch();
  const isLaptopScreen = useMediaQuery('(min-width: 1024px)');

  const {
    loadingExport,
    loadingAlarmHistory,
    sootblowAlarmHistoryData,
    errorAlarmHistory,
    hasMoreAlarmHistory,
    sootblowAlarmHistoryPage,
    sootblowAlarmHistoryTotal,
    sootblowAlarmHistoryDetailData,
    loadingAlarmHistoryUpdate,
    loading,
    errorGetDetailAlarmHistory,
    filterStartDate,
    filterEndDate,
  } = sootblowReducer;

  const [openDialog, setOpenDialog] = useState(false);
  const [description, setDescription] = useState('');
  const [openExportConfirmation, setOpenExportConfirmation] = useState(false);
  const [openDateFilter, setOpenDateFilter] = useState(false);

  const containerRef = useRef(0);
  const totalContainerHeight = containerRef?.current?.clientHeight;
  const [containerHeight, setContainerHeight] = useState(0);

  const alarmHistoryTable = sootblowAlarmHistoryData.map((item) =>
    createAlarmData(
      item.alarmId,
      item.date,
      item.setValue,
      item.actualValue,
      item.desc
    )
  );

  const loadAlarmHistoryList = async () => {
    if (sootblowAlarmHistoryData.length >= sootblowAlarmHistoryTotal) {
      dispatch(
        changeSootblow({
          hasMoreAlarmHistory: false,
        })
      );
    } else {
      setTimeout(async () => {
        await dispatch(
          changeSootblow({
            sootblowAlarmHistoryPage: sootblowAlarmHistoryPage + 1,
            hasMoreAlarmHistory: true,
          })
        );
        await dispatch(getAlarmHistory());
      }, 2000);
    }
  };

  const historyDetailFetch = async (id) => {
    await dispatch(getAlarmHistoryByID(id));
  };

  const updateAlarmHistoryHandler = async (id) => {
    if (description === '') {
      await dispatch(
        showMessage({
          message: 'Sorry, description cannot be empty',
          variant: 'error',
        })
      );
    } else {
      await dispatch(
        changeSootblow({
          loadingAlarmHistoryUpdate: true,
        })
      );
      const updateAlarmHistoryResponse = await dispatch(
        updateAlarmHistoryData({
          alarmId: id,
          desc: description || sootblowAlarmHistoryDetailData?.desc,
        })
      );
      if (updateAlarmHistoryResponse) {
        await dispatch(
          changeSootblow({
            sootblowAlarmHistoryData: [],
            sootblowAlarmHistoryLimit: 100,
            sootblowAlarmHistoryPage: 0,
            sootblowAlarmHistoryTotal: 0,
            loadingAlarmHistory: true,
          })
        );
        await handleCloseDialog();
        await dispatch(getAlarmHistory());
      }
    }
  };

  const handleClickOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const closeExportConfirmation = () => {
    setOpenExportConfirmation(false);
  };

  const cancelDateFilterHandler = () => {
    setOpenDateFilter(false);
  };

  const confirmExportHandler = async () => {
    const isSuccess = await dispatch(exportSootblowAlarmHistory());
    if (isSuccess) {
      closeExportConfirmation();
      cancelDateFilterHandler();
    }
  };

  const confirmDateFilterHandler = async () => {
    if (filterEndDate === null && filterStartDate === null) {
      await dispatch(
        showMessage({
          message: `Invalid date, select the date first!`,
          variant: 'error',
        })
      );
    } else if (filterStartDate === null) {
      await dispatch(
        showMessage({
          message: `Invalid start date`,
          variant: 'error',
        })
      );
    } else if (filterEndDate === null) {
      await dispatch(
        showMessage({
          message: `Invalid end date`,
          variant: 'error',
        })
      );
    } else if (filterEndDate !== '' || filterStartDate !== '') {
      const end = moment(filterStartDate);

      if (new Date(filterStartDate) > new Date(filterEndDate)) {
        await dispatch(
          showMessage({
            message: `Invalid date, end date cannot be before ${moment(
              end
            ).format('DD/MM/YYYY')}`,
            variant: 'error',
          })
        );
      } else {
        setOpenExportConfirmation(true);
      }
    } else {
      await dispatch(
        showMessage({
          message: 'You must select date first',
          variant: 'error',
        })
      );
    }
  };

  const resetFilterHandler = async () => {
    const TODAY = new Date();
    const DATE = new Date();
    const LAST_MONTH = DATE.setDate(DATE.getDate() - 30);
    await dispatch(
      changeSootblow({
        filterStartDate: LAST_MONTH,
        filterEndDate: TODAY,
      })
    );
    await dispatch(
      showMessage({
        message: `Date filter has been reset`,
        variant: 'success',
      })
    );
  };

  useEffect(() => {
    if (!isLaptopScreen) return;
    if (!containerRef.current) return; // wait for the containerRef to be available
    const resizeObserver = new ResizeObserver(() => {
      setContainerHeight(containerRef.current?.clientHeight - 60);
      // Do what you want to do when the size of the element changes
    });
    resizeObserver.observe(containerRef.current);
    // eslint-disable-next-line consistent-return
    return () => resizeObserver.disconnect(); // clean up
  }, [containerRef, isLaptopScreen, totalContainerHeight]);

  return (
    <>
      <Accordion
        className={
          expanded === 'panel6'
            ? 'max-h-full flex-1 w-full overflow-auto'
            : 'flex-initial w-full overflow-hidden'
        }
        expanded={expanded === 'panel6'}
        onChange={handleChange('panel6')}
        square
        ref={containerRef}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="panel6a-content"
          id="panel6a-header"
          className="w-full"
        >
          <div className="flex items-center gap-4 justify-between flex-1">
            <Typography className="text-12 xl:text-16 text-light-blue-300 font-600">
              Alarm History
            </Typography>
            <span className="flex items-center gap-4">
              <Tooltip title="Update Alarm History Data" arrow>
                <span>
                  <IconButton
                    size="small"
                    disabled={loadingAlarmHistory}
                    onClick={async (event) => {
                      const getAlarmData = async () => {
                        await dispatch(
                          changeSootblow({
                            sootblowAlarmHistoryData: [],
                            sootblowAlarmHistoryLimit: 100,
                            sootblowAlarmHistoryPage: 0,
                            sootblowAlarmHistoryTotal: 0,
                            loadingAlarmHistory: true,
                          })
                        );
                        await dispatch(getAlarmHistory());
                      };

                      if (expanded === 'panel6') {
                        event.stopPropagation();
                        getAlarmData();
                      } else {
                        getAlarmData();
                      }
                    }}
                    aria-label="refresh alarm"
                  >
                    <Refresh fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Export Alarm History Data" arrow>
                <span>
                  <IconButton
                    disabled={loadingAlarmHistory}
                    size="small"
                    onClick={async (event) => {
                      event.stopPropagation();
                      setOpenDateFilter(true);
                    }}
                    aria-label="export alarm history data"
                  >
                    <CloudDownload fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </span>
          </div>
        </AccordionSummary>
        <AccordionDetails className="p-0">
          {loadingAlarmHistory ? (
            <div className="flex-1 flex min-h-96 justify-center items-center py-4 md:p-0 mb-8 md:mb-0">
              <Typography className="text-12 xl:text-16">Loading</Typography>
            </div>
          ) : errorAlarmHistory ? (
            <div className="flex-1 flex min-h-96 justify-center items-center py-4 md:p-0 text-red ">
              <Typography className="text-12 xl:text-16">
                Sorry something went wrong!
              </Typography>
            </div>
          ) : alarmHistoryTable.length !== 0 ? (
            <TableContainer
              id="scrollableDiv"
              style={{
                maxHeight: isLaptopScreen ? containerHeight || 480 : 480,
                height: isLaptopScreen
                  ? containerHeight
                    ? isLaptopScreen
                    : 480
                  : 480,
              }}
              className="overflow-auto"
            >
              <InfiniteScroll
                dataLength={sootblowAlarmHistoryData.length}
                next={loadAlarmHistoryList}
                hasMore={
                  sootblowAlarmHistoryData.length >= sootblowAlarmHistoryTotal
                    ? false
                    : hasMoreAlarmHistory
                }
                loader={
                  <div className="flex items-center gap-8 justify-center py-10">
                    <CircularProgress color="inherit" size={24} />
                    <Typography className="text-12 xl:text-16 ">
                      Fetch more data...
                    </Typography>
                  </div>
                }
                endMessage={
                  <Typography className="text-center text-12 xl:text-16 my-10 text-light-blue-300">
                    You have seen all the data.
                  </Typography>
                }
                scrollableTarget="scrollableDiv"
              >
                <Table stickyHeader size="small" aria-label="a dense table">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="center"
                        className="text-11 xl:text-16 py-auto text-light-blue-300"
                      >
                        Date &amp; Time
                      </TableCell>
                      <TableCell
                        align="center"
                        className="text-11 xl:text-16 py-auto text-light-blue-300"
                      >
                        Set Value
                      </TableCell>
                      <TableCell
                        align="center"
                        className="text-11 xl:text-16 py-auto text-light-blue-300"
                      >
                        Actual Value
                      </TableCell>
                      <TableCell
                        align="center"
                        className="text-11 xl:text-16 py-auto text-light-blue-300"
                      >
                        Desc
                      </TableCell>
                      <TableCell
                        align="center"
                        className="text-11 xl:text-16 py-auto text-light-blue-300"
                      >
                        Modify
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {alarmHistoryTable.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell
                          component="th"
                          scope="row"
                          align="center"
                          className="text-10 xl:text-14 py-4"
                        >
                          {row.date || '-'}
                        </TableCell>
                        <TableCell
                          align="center"
                          className="text-10 xl:text-14 py-4"
                        >
                          {row.setValue
                            ? row?.setValue
                                ?.split(',')
                                .map((line, subIndex) => (
                                  <span key={subIndex}>
                                    {line}
                                    <br />
                                  </span>
                                ))
                            : '-'}
                        </TableCell>
                        <TableCell
                          align="center"
                          className="text-10 xl:text-14 py-4"
                        >
                          {row.actualValue
                            ? row?.actualValue
                                ?.split(',')
                                .map((line, subIndex) => (
                                  <span key={subIndex}>
                                    {line}
                                    <br />
                                  </span>
                                ))
                            : '-'}
                        </TableCell>
                        <TableCell
                          align="left"
                          className="text-10 xl:text-14 py-4"
                        >
                          {row.desc || '-'}
                        </TableCell>
                        <TableCell
                          align="center"
                          className="py-4 text-14 xl:text-16"
                        >
                          <IconButton
                            disabled={loading}
                            onClick={async () => {
                              setDescription(row?.desc);
                              await historyDetailFetch(row.alarmId);
                              await handleClickOpenDialog();
                            }}
                            size="small"
                          >
                            <Build className="text-14 xl:text-16" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </InfiniteScroll>
            </TableContainer>
          ) : (
            <div className="flex-1 flex min-h-96 justify-center items-center py-4 md:p-0 ">
              <Typography className="text-12 xl:text-16">
                No Alarm History Found
              </Typography>
            </div>
          )}
        </AccordionDetails>
      </Accordion>
      <Dialog
        fullWidth
        open={openDialog}
        maxWidth="sm"
        aria-labelledby="responsive-dialog-title"
      >
        <Typography className="text-16 m-24" id="responsive-dialog-title">
          Modify this alarm history description?
        </Typography>
        <DialogContent>
          {loading ? (
            <LinearProgress color="secondary" />
          ) : (
            <Grid container spacing={1}>
              <Grid container alignItems="baseline" item xs={12}>
                <Grid
                  item
                  xs={12}
                  md={3}
                  className="text-14 text-light-blue-300"
                >
                  Timestamp
                </Grid>
                <Grid item xs={12} md={9} className="text-14">
                  {sootblowAlarmHistoryDetailData?.date || '-'}
                </Grid>
              </Grid>
              <Grid container alignItems="baseline" item xs={12}>
                <Grid
                  item
                  xs={12}
                  md={3}
                  className="text-14 text-light-blue-300"
                >
                  Set Value
                </Grid>
                <Grid item xs={12} md={9} className="text-14">
                  {sootblowAlarmHistoryDetailData?.setValue || '-'}
                </Grid>
              </Grid>
              <Grid container alignItems="baseline" item xs={12}>
                <Grid
                  item
                  xs={12}
                  md={3}
                  className="text-14 text-light-blue-300"
                >
                  Actual Value
                </Grid>
                <Grid item xs={12} md={9} className="text-14">
                  {sootblowAlarmHistoryDetailData?.actualValue || '-'}
                </Grid>
              </Grid>
              <Grid container alignItems="baseline" item xs={12}>
                <Grid
                  item
                  xs={12}
                  md={3}
                  className="text-14 text-light-blue-300"
                >
                  Description
                </Grid>
                <Grid item xs={12} md={9}>
                  <TextField
                    variant="outlined"
                    defaultValue={
                      sootblowAlarmHistoryDetailData?.desc || description
                    }
                    fullWidth
                    multiline
                    size="small"
                    color="secondary"
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions className="p-24">
          {!loadingAlarmHistoryUpdate && (
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
              className="text-12 px-6"
            >
              Cancel
            </Button>
          )}
          {loadingAlarmHistoryUpdate ? (
            <Button
              disabled
              variant="contained"
              className={clsx('text-12 px-6')}
            >
              Saving
            </Button>
          ) : (
            <Button
              onClick={() =>
                updateAlarmHistoryHandler(
                  sootblowAlarmHistoryDetailData?.alarmId
                )
              }
              variant="contained"
              autoFocus
              disabled={errorGetDetailAlarmHistory || loading}
              className={clsx(classes.saveButton, 'text-12 px-6')}
            >
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {openDateFilter && (
        <DateRangeModal
          format="YYYY-MM-DD"
          views={['date']}
          title="Please select a time range to export alarm history data"
          filterStartDateValue={filterStartDate}
          filterEndDateValue={filterEndDate}
          changeFilterStartDate={(e) =>
            dispatch(changeSootblow({ filterStartDate: e }))
          }
          changeFilterEndDate={(e) =>
            dispatch(changeSootblow({ filterEndDate: e }))
          }
          loading={false}
          openDateFilter={openDateFilter}
          resetFilterHandler={resetFilterHandler}
          cancelDateFilterHandler={cancelDateFilterHandler}
          confirmDateFilterHandler={confirmDateFilterHandler}
        />
      )}
      <Confirmation
        confirmText={loadingExport ? 'Exporting' : 'OK'}
        loading={loadingExport}
        open={openExportConfirmation}
        title="Export Alarm History Data"
        contentText="Confirm to export sootblow alarm history data?"
        cancelHandler={closeExportConfirmation}
        confirmHandler={confirmExportHandler}
      />
    </>
  );
};

export default AlarmHistory;
