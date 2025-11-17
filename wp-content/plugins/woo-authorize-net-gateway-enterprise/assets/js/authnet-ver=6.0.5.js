jQuery( function( $ ) {
	'use strict';

	let paymentsClient = null;
	let paymentToken = null;
	let googlePayBaseCardMethod = {
		type: 'CARD',
		parameters: {
			allowedAuthMethods: ["CRYPTOGRAM_3DS"],
			allowedCardNetworks: ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"]
		}
	};

	const googlePayCardMethod = Object.assign(
		{},
		googlePayBaseCardMethod,
		{
			tokenizationSpecification: {
				type: 'PAYMENT_GATEWAY',
				parameters: {
					'gateway': 'authorizenet',
					'gatewayMerchantId': '604853'
				}
			}
		}
	);

	/**
	 * Object to handle Authnet payment forms.
	 */
	var wc_authnet_form = {

		/**
		 * Initialize event handlers and UI state.
		 */
		init: function() {
			// checkout page
			if ( $( 'form.woocommerce-checkout' ).length ) {
				this.form = $( 'form.woocommerce-checkout' );
			}

			$( 'form.woocommerce-checkout' )
				.on(
					'checkout_place_order_authnet',
					this.onSubmit
				);

			$( 'form.woocommerce-checkout' )
				.on(
					'checkout_place_order_authnet-echeck',
					this.onSubmit
				);

			// pay order page
			if ( $( 'form#order_review' ).length ) {
				this.form = $( 'form#order_review' );
			}

			$( 'form#order_review' )
				.on(
					'submit',
					this.onSubmit
				);

			// add payment method page
			if ( $( 'form#add_payment_method' ).length ) {
				this.form = $( 'form#add_payment_method' );
			}

			$( 'form#add_payment_method' )
				.on(
					'submit',
					this.onSubmit
				);

			$( document )
				.on(
					'change',
					'#wc-authnet-cc-form :input, #authnet-echeck-cc-form :input',
					this.onCCFormChange
				)
				.on(
					'authnetError',
					this.onError
				)
				.on(
					'checkout_error',
					this.clearToken
				);

			wc_authnet_form.createExpressElements();

			if ( 'yes' === wc_authnet_params.is_checkout ) {
				$( document.body ).on( 'updated_checkout', function() {
					// Re-mount on updated checkout
					wc_authnet_form.createExpressElements();
				} );
			}
		},

		getGooglePayClient: function() {
			if ( paymentsClient === null ) {
				paymentsClient = new google.payments.api.PaymentsClient({environment: 'TEST'});
			}
			return paymentsClient;
		},

		getGoogleIsReadyToPayRequest: function() {
			return Object.assign(
				{},
				{
					apiVersion: 2,
					apiVersionMinor: 0
				},
				{
					allowedPaymentMethods: [googlePayBaseCardMethod]
				}
			);
		},

		getGooglePaymentDataRequest: function() {
			const paymentDataRequest = Object.assign({}, {
				apiVersion: 2,
				apiVersionMinor: 0
			});
			paymentDataRequest.allowedPaymentMethods = [googlePayCardMethod];
			paymentDataRequest.transactionInfo = {
				countryCode: $( '#billing_country' ).length ? $( '#billing_country' ).val() : wc_authnet_params.billing_country,
				currencyCode: wc_authnet_params.currency,
				totalPriceStatus: 'FINAL',
				// set to cart total
				totalPrice: wc_authnet_form.getSelectedPaymentElement().closest( 'ul.payment_methods' ).find( '.payment_method_authnet #authnet-payment-data' ).attr( 'data-amount' )
			};
			paymentDataRequest.merchantInfo = {
				// @todo a merchant ID is available for a production environment after approval by Google
				// See {@link https://developers.google.com/pay/api/web/guides/test-and-deploy/integration-checklist|Integration checklist}
				// merchantId: '12345678901234567890',
				merchantName: 'Example Merchant'
			};
			return paymentDataRequest;
		},

		createExpressElements: function() {
			/*if( ! wc_authnet_params.googlepay_enable && ! wc_authnet_params.applepay_enable ) {
				console.log('express payments disabled');
				return false;
			}
			const req = {
				"country" : $( '#billing_country' ).length ? $( '#billing_country' ).val() : wc_authnet_params.billing_country,
				"currency" : wc_authnet_params.currency,
				"price" : wc_authnet_form.getSelectedPaymentElement().closest( 'ul.payment_methods' ).find( '.payment_method_authnet #authnet-payment-data' ).attr( 'data-amount' )
			};*/
			let googlepay = {};
			//if( wc_authnet_params.googlepay_enable ) {

			const paymentsClient = this.getGooglePayClient();
			paymentsClient.isReadyToPay(this.getGoogleIsReadyToPayRequest())
				.then(function(response) {
					if (response.result) {
						const button = paymentsClient.createButton({
							onClick: function() {
								const paymentDataRequest = wc_authnet_form.getGooglePaymentDataRequest();

								paymentsClient.loadPaymentData(paymentDataRequest)
									.then(function(paymentData) {
										// handle the response
										console.log(paymentData);
										// @todo pass payment token to your gateway to process payment
										// @note DO NOT save the payment credentials for future transactions,
										// unless they're used for merchant-initiated transactions with user
										// consent in place.
										paymentToken =  window.btoa(paymentData.paymentMethodData.tokenizationData.token);
										$("input#payment_method_authnet").prop("checked", true).trigger('click');
										$("input#wc-authnet-payment-token-new").prop("checked", true).trigger('click');
										wc_authnet_form.form.append( "<input type='hidden' class='authnet_nonce' name='authnet_nonce' value='" + paymentToken + "'/>" );
										wc_authnet_form.form.append( "<input type='hidden' class='authnet_data_descriptor' name='authnet_data_descriptor' value='COMMON.GOOGLE.INAPP.PAYMENT'/>" );
										wc_authnet_form.form.submit();
									})
									.catch(function(err) {
										// show error in developer console for debugging
										console.error(err);
									});
							},
							allowedPaymentMethods: [googlePayBaseCardMethod]
						});
						document.getElementById('wc-authnet-googlepay').appendChild(button);
					}
				})
				.catch(function(err) {
					// show error in developer console for debugging
					console.error(err);
				});
				/*googlepay = {
					'emailRequired': true,
					'selector': '#wc-authnet-googlepay',

				};
				if( wc_authnet_params.googlepay_billing_shipping ) {
					googlepay.billingAddressRequired = true;
					googlepay.billingAddressParameters = {
						'phoneNumberRequired': true,
						'format': 'FULL'
					};
					if( wc_authnet_params.needs_shipping_address ) {
						googlepay.shippingAddressRequired = true;
						googlepay.shippingAddressParameters = {
							'allowedCountryCodes': wc_authnet_params.shipping_countries
						};
					}
				}
			//}
			/*let applepay = {};
			if( wc_authnet_params.applepay_enable ) {
				applepay = {
					//'billingAddressRequired': false,
					//'emailRequired': true,
					'contactFields': [
						'phone',
						'email'
					],
					'selector': '#wc-authnet-applepay',
					//'shippingAddressRequired' : false

				};
				/*if( wc_authnet_params.googlepay_billing_shipping ) {
					applepay.billingAddressRequired = true;
					applepay.billingAddressParameters = {
						'phoneNumberRequired': true,
						'format': 'FULL'
					};
					if( wc_authnet_params.needs_shipping_address ) {
						applepay.shippingAddressRequired = true;
						applepay.shippingAddressParameters = {
							'allowedCountryCodes': wc_authnet_params.shipping_countries
						};
					}
				}/
			}*/

		},

		isAuthnetChosen: function() {
			return $( '#payment_method_authnet' ).is( ':checked' ) && ( ! $( 'input[name="wc-authnet-payment-token"]:checked' ).length || 'new' === $( 'input[name="wc-authnet-payment-token"]:checked' ).val() );
		},

		isAuthneteCheckChosen: function() {
			return $( '#payment_method_authnet-echeck' ).is( ':checked' ) && ( ! $( 'input[name="wc-authnet-echeck-payment-token"]:checked' ).length || 'new' === $( 'input[name="wc-authnet-echeck-payment-token"]:checked' ).val() );
		},

		hasToken: function() {
			return ( 0 < $( 'input.authnet_nonce' ).length ) && ( 0 < $( 'input.authnet_data_descriptor' ).length );
		},

		block: function() {
			wc_authnet_form.form.block( {
				message: null,
				overlayCSS: {
					background: '#fff',
					opacity: 0.6
				}
			} );
		},

		unblock: function() {
			wc_authnet_form.form.unblock();
		},

		getSelectedPaymentElement: function() {
			return $( '.payment_methods input[name="payment_method"]:checked' );
		},

		onError: function( e, responseObject ) {
			//console.log(responseObject.response);
			var message = responseObject.response.text;

			$( '.wc-authnet-error, .authnet_nonce' ).remove();
			$( '.wc-authnet-error, .authnet_data_descriptor' ).remove();
			if ( wc_authnet_form.isAuthneteCheckChosen() ) {
				$( '#authnet-echeck-account-name' ).closest( 'p' ).before( '<ul class="woocommerce_error woocommerce-error wc-authnet-error"><li>' + message + '</li></ul>' );
			} else {
				$( '#authnet-card-number' ).closest( 'p' ).before( '<ul class="woocommerce_error woocommerce-error wc-authnet-error"><li>' + message + '</li></ul>' );
			}
			wc_authnet_form.unblock();
		},

		onSubmit: function( e ) {
			var authData = {};
			var secureData = {};

			if ( wc_authnet_form.isAuthnetChosen() && ! wc_authnet_form.hasToken() ) {
				e.preventDefault();
				wc_authnet_form.block();

				var card_allowed = false,
                    card	   = $( '#authnet-card-number' ).val(),
					cvc        = $( '#authnet-card-cvc' ).val(),
					expires    = $( '#authnet-card-expiry' ).payment( 'cardExpiryVal' ),
					first_name = $( '#billing_first_name' ).length ? $( '#billing_first_name' ).val() : wc_authnet_params.billing_first_name,
					last_name  = $( '#billing_last_name' ).length ? $( '#billing_last_name' ).val() : wc_authnet_params.billing_last_name;

                if ( $( '#authnet-card-number' ).hasClass( 'identified' ) ) {
                    wc_authnet_params.allowed_card_types.forEach(function (card_type) {
                        if ( $( '#authnet-card-number' ).hasClass( card_type.replace( 'diners-club', 'dinersclub' ) ) ) {
                            card_allowed = true;
                        }
                    });

                    if ( ! card_allowed ) {
                        $( '.wc-authnet-error, .authnet_nonce' ).remove();
                        $( '.wc-authnet-error, .authnet_data_descriptor' ).remove();
                        $( '#authnet-card-number' ).closest( 'p' ).before( '<ul class="woocommerce_error woocommerce-error wc-authnet-error"><li>' + wc_authnet_params.card_disallowed_error + '</li></ul>' );
                        wc_authnet_form.unblock();
                        return false;
                    }
                }

                if ( cvc === '' ) {
					$( '.wc-authnet-error, .authnet_nonce' ).remove();
					$( '.wc-authnet-error, .authnet_data_descriptor' ).remove();
					$( '#authnet-card-number' ).closest( 'p' ).before( '<ul class="woocommerce_error woocommerce-error wc-authnet-error"><li>' + wc_authnet_params.no_cvv_error + '</li></ul>' );
					wc_authnet_form.unblock();
					return false;
				}

				authData.clientKey = wc_authnet_params.client_key;
				authData.apiLoginID = wc_authnet_params.login_id;

				var cardData = {};
				cardData.cardNumber = card.replace( /\s/g, '' );
				cardData.month = expires.month.toString();
				cardData.year = expires.year.toString().slice( -2 );
				cardData.cardCode = cvc;
				if ( first_name && last_name ) {
					cardData.fullName = first_name + ' ' + last_name;
				}

				secureData.authData = authData;
				secureData.cardData = cardData;

				Accept.dispatchData( secureData, wc_authnet_form.onAuthnetResponse );

				// Prevent form submitting
				return false;
			} else if ( wc_authnet_form.isAuthneteCheckChosen() && ! wc_authnet_form.hasToken() ) {
				e.preventDefault();
				wc_authnet_form.block();

				var routing_number  = $( '#authnet-echeck-routing-number' ).val(),
					account_number	= $( '#authnet-echeck-account-number' ).val(),
					account_name    = $( '#authnet-echeck-account-name' ).val(),
					holder_type     = $( '[name="authnet-echeck-holder-type"]' ).val(),
					account_type    = holder_type == 'business' ? 'businessChecking' : $( '[name="authnet-echeck-account-type"]' ).val(),
					first_name		= $( '#billing_first_name' ).length ? $( '#billing_first_name' ).val() : wc_authnet_echeck_params.billing_first_name,
					last_name  		= $( '#billing_last_name' ).length ? $( '#billing_last_name' ).val() : wc_authnet_echeck_params.billing_last_name;

                if ( routing_number === '' ) {
					$( '.wc-authnet-error, .authnet_nonce' ).remove();
					$( '.wc-authnet-error, .authnet_data_descriptor' ).remove();
					$( '#authnet-echeck-account-name' ).closest( 'p' ).before( '<ul class="woocommerce_error woocommerce-error wc-authnet-error"><li>' + wc_authnet_echeck_params.no_routing_number_error + '</li></ul>' );
					wc_authnet_form.unblock();
					return false;
				}

				if ( account_number === '' ) {
					$( '.wc-authnet-error, .authnet_nonce' ).remove();
					$( '.wc-authnet-error, .authnet_data_descriptor' ).remove();
					$( '#authnet-echeck-account-name' ).closest( 'p' ).before( '<ul class="woocommerce_error woocommerce-error wc-authnet-error"><li>' + wc_authnet_echeck_params.no_account_number_error + '</li></ul>' );
					wc_authnet_form.unblock();
					return false;
				}

				authData.clientKey = wc_authnet_echeck_params.client_key;
				authData.apiLoginID = wc_authnet_echeck_params.login_id;

				var bankData = {};
				bankData.accountNumber = account_number;
				bankData.routingNumber = routing_number;
				bankData.nameOnAccount = account_name;
				bankData.accountType = account_type;

				//console.log( bankData );

				if ( bankData.nameOnAccount === '' && first_name && last_name ) {
					bankData.nameOnAccount = first_name + ' ' + last_name;
				}

				secureData.authData = authData;
				secureData.bankData = bankData;

				Accept.dispatchData( secureData, wc_authnet_form.onAuthnetResponse );

				// Prevent form submitting
				return false;
			}
		},

		onCCFormChange: function() {
			$( '.wc-authnet-error, .authnet_nonce' ).remove();
			$( '.wc-authnet-error, .authnet_data_descriptor' ).remove();
		},

		onAuthnetResponse: function( response ) {

			if ( response.messages.resultCode === "Error" ) {
				var i = 0;
				while ( i < response.messages.message.length ) {
					//console.log( response.messages.message[i].code + ": " + response.messages.message[i].text );
					$( document ).trigger( 'authnetError', { response: response.messages.message[i] } );
					i = i + 1;
				}
			} else {
				//console.log(response);
				// insert the token into the form so it gets submitted to the server
				wc_authnet_form.form.append( "<input type='hidden' class='authnet_nonce' name='authnet_nonce' value='" + response.opaqueData.dataValue + "'/>" );
				wc_authnet_form.form.append( "<input type='hidden' class='authnet_data_descriptor' name='authnet_data_descriptor' value='" + response.opaqueData.dataDescriptor + "'/>" );
				wc_authnet_form.form.submit();
			}
		},

		clearToken: function() {
			$( '.authnet_nonce' ).remove();
			$( '.authnet_data_descriptor' ).remove();
		}
	};

	wc_authnet_form.init();
} );