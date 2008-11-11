jQuery(document).ready(function(){
	/** get settings **/
	var bText = Drupal.settings.uc_ajax_cart.text ;
	var disabled = Drupal.settings.uc_ajax_cart.disable ;
	var bclass = Drupal.settings.uc_ajax_cart.bclass ;
	var ddSupport = Drupal.settings.uc_ajax_cart.ddSupport;
	if ( ddSupport == true )
	{
		//Activate drag and drop support
		jQuery('#ajaxCartUpdate').droppable({ accept : '.product_image_drag' ,
			hoverClass : 'dropHover',
			activeClass   : 'dropActive',
			tolerance : 'pointer',
			drop : function (ev,ui)
			{
					var i = ev.target.id.split("_").reverse().shift();
					jQuery('#uc-product-add-to-cart-form-' + i).trigger('submit');
					return true ;
			}
		});
	}
	jQuery('form.ajax-cart-form').each(function(){
		var $form = jQuery(this);
		if ( ddSupport == true )
		{
			var nid = $form.attr('id').split('-').reverse().shift();
			var $img = jQuery('#product_image_' + nid );
			if ( $img.length > 0 )
			{
				$img.eq(0).draggable({ helper: "clone",
									   appendTo : 'body',
									   zIndex : 10000 ,
									   opacity : 1 });
			}
		}
		$form.bind('submit',function(){
				var data = jQuery(this).formToArray();
				jQuery(this).find('input[@type=submit],button[@type=submit]').each(function(){
					var tagName = this.tagName ;
					var button = jQuery(this);
					if ( bText != false )
					{
						if ( tagName == "BUTTON" )
						{
						 	button.attr('oldTitle',button.html());
						 	button.html(bText);
						}
						else
						{
							 button.attr('oldTitle',button.attr("value"));
							 button.attr('value',bText);
						}
					}
					button.addClass(bclass);
					if ( disabled == 1 )
					{
						button.css({display : 'none'});
						button.after('<div class="ajax-cart-msg">' + bText + '</div>');
					}
				});
				jQuery(this).ajaxSubmit({
					success : updateAjaxCart,
					data : data,
					async : true,
					dataType : 'json',
					url : Drupal.settings.base_path + 'cart/ajax/update'
				});
		return false;});
	})
})
function updateAjaxCart(data,responseType)
{
	var $uEle = jQuery('#ajaxCartUpdate').eq(0);
	var form_id = data.form_id.split('_').join('-');
	var bText = Drupal.settings.uc_ajax_cart.text ;
	var bclass = Drupal.settings.uc_ajax_cart.bclass ;
	var effects = Drupal.settings.uc_ajax_cart.effects;
	if ( typeof collapsed_block != "undefined"
	     && collapsed_block == true)
	{
		cart_block_toggle();
	}
	jQuery('#' + form_id).find('div.ajax-cart-msg').remove();
	jQuery('#' + form_id).find('input[@type=submit],button[@type=submit]').show().removeClass(bclass).removeAttr('disabled').each(function(){
		if ( bText != false )
		{
			if ( this.tagName == "INPUT" ) this.value = jQuery(this).attr('oldTitle');
			else jQuery(this).html(jQuery(this).attr('oldTitle'));
		}
	});
	if ( effects == true )
	{
		jQuery('#ajaxCartUpdate').effect('highlight',{},500);
	}
	$uEle.empty().html(data.content);
	jQuery('body').css({cursor : 'default'});
}