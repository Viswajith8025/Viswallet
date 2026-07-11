package com.viswajith.rupee_track.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import com.viswajith.rupee_track.MainActivity
import com.viswajith.rupee_track.R
import es.antonborri.home_widget.HomeWidgetLaunchIntent
import es.antonborri.home_widget.HomeWidgetProvider

enum class WidgetSize { COMPACT, STANDARD, WIDE, FULL }

abstract class VisWalletWidgetProvider(
    private val layoutId: Int,
    private val widgetSize: WidgetSize,
) : HomeWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
        widgetData: SharedPreferences,
    ) {
        val dark = isDarkTheme(context, widgetData)
        for (widgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, layoutId)
            bindCommonData(context, views, widgetData, dark)
            bindSizeSpecific(context, views, widgetData, dark, widgetSize)
            bindActions(context, views, widgetSize)
            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }

    private fun bindCommonData(
        context: Context,
        views: RemoteViews,
        data: SharedPreferences,
        dark: Boolean,
    ) {
        val bg = if (dark) R.drawable.widget_bg_dark else R.drawable.widget_bg_light
        views.setInt(R.id.widget_root, "setBackgroundResource", bg)

        views.setTextViewText(R.id.widget_money_left, data.getString("money_left", "—"))
        views.setTextViewText(R.id.widget_today_spent, data.getString("today_spent", "—"))
        views.setTextViewText(R.id.widget_safe_daily, data.getString("safe_daily", "—"))
        views.setTextViewText(R.id.widget_cycle_label, data.getString("cycle_label", "Viswallet"))
        views.setTextViewText(
            R.id.widget_health_score,
            data.getString("health_score", "—"),
        )

        val budget = data.getString("budget_progress", "0")?.toIntOrNull() ?: 0
        views.setProgressBar(R.id.widget_budget_progress, 100, budget.coerceIn(0, 100), false)
        views.setTextViewText(R.id.widget_budget_label, "$budget% on track")

        views.setTextViewText(
            R.id.widget_recent_title,
            data.getString("recent_tx_title", "—"),
        )
        views.setTextViewText(
            R.id.widget_recent_amount,
            data.getString("recent_tx_amount", "—"),
        )

        val subsCount = data.getString("upcoming_subs_count", "0") ?: "0"
        views.setTextViewText(
            R.id.widget_subs_line,
            "Subs: $subsCount · ${data.getString("upcoming_subs_label", "")}",
        )
        val bills = data.getString("overdue_loans_count", "0")
            ?: data.getString("upcoming_bills_count", "0") ?: "0"
        views.setTextViewText(R.id.widget_bills_line, "Overdue loans: $bills")

        views.setTextViewText(
            R.id.widget_wishlist,
            data.getString("wishlist_note", "No wishlist items yet"),
        )
    }

    private fun bindSizeSpecific(
        context: Context,
        views: RemoteViews,
        data: SharedPreferences,
        dark: Boolean,
        size: WidgetSize,
    ) {
        when (size) {
            WidgetSize.COMPACT -> {
                views.setViewVisibility(R.id.widget_extended, View.GONE)
                views.setViewVisibility(R.id.widget_actions_row, View.VISIBLE)
            }
            WidgetSize.STANDARD -> {
                views.setViewVisibility(R.id.widget_extended, View.VISIBLE)
                views.setViewVisibility(R.id.widget_wide_section, View.GONE)
                views.setViewVisibility(R.id.widget_full_section, View.GONE)
            }
            WidgetSize.WIDE -> {
                views.setViewVisibility(R.id.widget_extended, View.VISIBLE)
                views.setViewVisibility(R.id.widget_wide_section, View.VISIBLE)
                views.setViewVisibility(R.id.widget_full_section, View.GONE)
            }
        WidgetSize.FULL -> {
                views.setViewVisibility(R.id.widget_extended, View.VISIBLE)
                views.setViewVisibility(R.id.widget_wide_section, View.VISIBLE)
                views.setViewVisibility(R.id.widget_full_section, View.VISIBLE)
                views.setViewVisibility(R.id.widget_btn_budget, View.VISIBLE)
                views.setViewVisibility(R.id.widget_btn_health, View.VISIBLE)
            }
        }
    }

    private fun bindActions(context: Context, views: RemoteViews, size: WidgetSize) {
        views.setOnClickPendingIntent(
            R.id.widget_root,
            launchIntent(context, "dashboard"),
        )
        views.setOnClickPendingIntent(
            R.id.widget_btn_add,
            launchIntent(context, "add-expense"),
        )
        views.setOnClickPendingIntent(
            R.id.widget_btn_calendar,
            launchIntent(context, "calendar"),
        )
        if (size == WidgetSize.FULL) {
            views.setOnClickPendingIntent(
                R.id.widget_btn_budget,
                launchIntent(context, "budget"),
            )
            views.setOnClickPendingIntent(
                R.id.widget_btn_health,
                launchIntent(context, "health"),
            )
        }
    }

    private fun launchIntent(context: Context, action: String): PendingIntent {
        return HomeWidgetLaunchIntent.getActivity(
            context,
            MainActivity::class.java,
            Uri.parse("viswallet://$action"),
        )
    }

    private fun isDarkTheme(context: Context, data: SharedPreferences): Boolean {
        val mode = data.getString("theme_mode", "system")
        return when (mode) {
            "dark" -> true
            "light" -> false
            else -> {
                val night =
                    context.resources.configuration.uiMode and
                        android.content.res.Configuration.UI_MODE_NIGHT_MASK
                night == android.content.res.Configuration.UI_MODE_NIGHT_YES
            }
        }
    }
}

class VisWalletCompactWidgetProvider :
    VisWalletWidgetProvider(R.layout.widget_viswallet, WidgetSize.COMPACT)

class VisWalletStandardWidgetProvider :
    VisWalletWidgetProvider(R.layout.widget_viswallet, WidgetSize.STANDARD)

class VisWalletWideWidgetProvider :
    VisWalletWidgetProvider(R.layout.widget_viswallet, WidgetSize.WIDE)

class VisWalletFullWidgetProvider :
    VisWalletWidgetProvider(R.layout.widget_viswallet, WidgetSize.FULL)
