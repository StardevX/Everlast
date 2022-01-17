import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import TabPanel from "../../components/TabPanel";
import { changeApproval, changeDeposit } from "../../slices/PresaleThunk";
import { useWeb3Context } from "src/hooks/web3Context";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import {
  Paper,
  Grid,
  Typography,
  Box,
  Zoom,
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
} from "@material-ui/core";
import { trim } from "../../helpers";
import "./presale.scss";
import { Skeleton } from "@material-ui/lab";
import { error } from "../../slices/MessagesSlice";
import { ethers, BigNumber } from "ethers";

function Presale() {
  const dispatch = useDispatch();
  const { provider, address, connected, connect, chainID } = useWeb3Context();
  const [quantity, setQuantity] = useState("");
  const pendingTransactions = useSelector(state => {
    return state.pendingTransactions;
  });
  const busdBalance = useSelector(state => {
    return state.account.balances && state.account.balances.busd;
  });
  const setMax = () => {
    setQuantity(busdBalance);
  };
  const onSeekApproval = async token => {
    await dispatch(changeApproval({ address, token, provider, networkID: chainID }));
  };
  const presaleAllowance = useSelector(state => {
    return state.account.presale && state.account.presale.presaleAllowance;
  });
  const onChangeDeposit = async action => {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(quantity) || quantity === 0 || quantity === "") {
      // eslint-disable-next-line no-alert
      return dispatch(error("Please enter a value!"));
    }

    // 1st catch if quantity > balance
    let gweiValue = ethers.utils.parseUnits(quantity, "ether");

    if (action === "presale" && gweiValue.gt(ethers.utils.parseUnits(busdBalance, "ether"))) {
      return dispatch(error("You cannot deposit more than your BUSD balance."));
    }
    await dispatch(changeDeposit({ address, action, value: quantity.toString(), provider, networkID: chainID }));
  };
  const hasAllowance = useCallback(
    token => {
      if (token === "busd") return presaleAllowance > 0;
      return 0;
    },
    [presaleAllowance],
  );
  const isAllowanceDataLoading = presaleAllowance == null;
  return (
    <div id="dashboard-view">
      <Paper className={`ohm-card`}>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <div className="card-header">
              <Typography variant="h5">Presale</Typography>
            </div>
          </Grid>
          <Grid item>
            <div className="stake-top-metrics">
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} sm={6} md={6} lg={6}>
                  <div className="stake-apy">
                    <Typography variant="h5" color="textSecondary">
                      Limit per User
                    </Typography>
                    <Typography variant="h4" color="textSecondary">
                      1000 BUSD
                    </Typography>
                  </div>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={6}>
                  <div className="stake-apy">
                    <Typography variant="h5" color="textSecondary">
                      EVER Price
                    </Typography>
                    <Typography variant="h4" color="textSecondary">
                      10 BUSD
                    </Typography>
                  </div>
                </Grid>
              </Grid>
            </div>
          </Grid>
          <Grid item>
            <div className="stake-top-metrics" style={{ whiteSpace: "normal" }}>
              <Grid container spacing={1} alignItems="center" justifyContent="center">
                {address && !isAllowanceDataLoading ? (
                  !hasAllowance("busd") ? (
                    <Box className="help-text">
                      <Typography variant="body1" className="stake-note" color="textSecondary">
                        <>
                          First time deposit <b>BUSD</b>?
                          <br />
                          Please approve Everlast Dao to use your <b>BUSD</b> for presale.
                        </>
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Grid item xs={12} sm={1} md={1} lg={1} />
                      <Grid item xs={12} sm={4} md={4} lg={4}>
                        <FormControl className="ohm-input" variant="outlined" color="primary">
                          <InputLabel htmlFor="amount-input"></InputLabel>
                          <OutlinedInput
                            id="amount-input"
                            type="number"
                            placeholder="Enter an amount"
                            className="stake-input"
                            value={quantity}
                            width="70%"
                            onChange={e => setQuantity(e.target.value)}
                            labelWidth={0}
                            endAdornment={
                              <InputAdornment position="end">
                                <Button variant="text" onClick={setMax} color="inherit">
                                  Max
                                </Button>
                              </InputAdornment>
                            }
                          />
                        </FormControl>
                      </Grid>
                    </>
                  )
                ) : (
                  <Skeleton width="35%" />
                )}

                {isAllowanceDataLoading ? (
                  <Skeleton width="35%" />
                ) : address && hasAllowance("busd") ? (
                  <>
                    <Grid item xs={12} sm={2} md={2} lg={2} />
                    <Grid item xs={12} sm={4} md={4} lg={4}>
                      <Button
                        className="stake-button"
                        variant="contained"
                        color="primary"
                        disabled={isPendingTxn(pendingTransactions, "deposit")}
                        onClick={() => {
                          onChangeDeposit("presale");
                        }}
                      >
                        {txnButtonText(pendingTransactions, "deposit", "Deposit BUSD")}
                      </Button>
                    </Grid>
                  </>
                ) : (
                  <Grid item xs={12} sm={6} md={6} lg={6}>
                    <Button
                      className="stake-button"
                      variant="contained"
                      color="primary"
                      disabled={isPendingTxn(pendingTransactions, "approve_deposit")}
                      onClick={() => {
                        onSeekApproval("busd");
                      }}
                    >
                      {txnButtonText(pendingTransactions, "approve_deposit", "Approve")}
                    </Button>
                  </Grid>
                )}
              </Grid>
            </div>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
}

export default Presale;
