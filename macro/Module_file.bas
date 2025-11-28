Attribute VB_Name = "Module_file"

Sub シート更新()
Attribute シート更新.VB_Description = "マクロ記録日 : 2012/6/9  ユーザー名 : User"
Attribute シート更新.VB_ProcData.VB_Invoke_Func = " \n14"

ActiveSheet.Calculate
End Sub


Sub 選択部分更新()

Selection.Calculate
End Sub

Sub tes()

Sheet11.Visible = True

Sheets("top").Shapes("game_reopen").Top = 1200
Sheets("top").Shapes("game_reopen").left = 1200
Range("top!B5") = ""

End Sub


Sub シート非表示()

Sheet1.Visible = xlVeryHidden
Sheet2.Visible = xlVeryHidden
Sheet3.Visible = xlVeryHidden
Sheet4.Visible = xlVeryHidden
Sheet5.Visible = xlVeryHidden
Sheet6.Visible = xlVeryHidden
Sheet7.Visible = xlVeryHidden
Sheet8.Visible = xlVeryHidden
Sheet9.Visible = xlVeryHidden
Sheet10.Visible = xlVeryHidden
Sheet11.Visible = xlVeryHidden
Sheet12.Visible = xlVeryHidden
Sheet13.Visible = xlVeryHidden
Sheet14.Visible = xlVeryHidden
Sheet15.Visible = xlVeryHidden
Sheet16.Visible = xlVeryHidden
Sheet17.Visible = xlVeryHidden
Sheet18.Visible = xlVeryHidden
Sheet19.Visible = xlVeryHidden
Sheet20.Visible = xlVeryHidden
Sheet21.Visible = xlVeryHidden
Sheet22.Visible = xlVeryHidden
Sheet23.Visible = xlVeryHidden
Sheet24.Visible = xlVeryHidden
Sheet25.Visible = xlVeryHidden
Sheet26.Visible = xlVeryHidden
Sheet27.Visible = xlVeryHidden
Sheet28.Visible = xlVeryHidden

End Sub

Sub シート再表示()

Sheet1.Visible = True
Sheet2.Visible = True
Sheet3.Visible = True
Sheet4.Visible = True
Sheet5.Visible = True
Sheet6.Visible = True
Sheet7.Visible = True
Sheet8.Visible = True
Sheet9.Visible = True
Sheet10.Visible = True
Sheet11.Visible = True
Sheet12.Visible = True
Sheet13.Visible = True
Sheet14.Visible = True
Sheet15.Visible = True
Sheet16.Visible = True
Sheet17.Visible = True
Sheet18.Visible = True
Sheet19.Visible = True
Sheet20.Visible = True
Sheet21.Visible = True
Sheet22.Visible = True
Sheet23.Visible = True
Sheet24.Visible = True
Sheet25.Visible = True
Sheet26.Visible = True
Sheet27.Visible = True
Sheet28.Visible = True

End Sub
Sub 初期データファイルオープン()

Dim wb As Workbook
For Each wb In Workbooks
    If wb.Name = "intialdata.xls" Then
        Exit Sub
    End If
Next wb
Workbooks.Open ActiveWorkbook.Path & "\intialdata.xls"

End Sub

Sub 初期データファイルクローズ()

If CloseMode = 0 Then
    Application.DisplayAlerts = False
    Workbooks("intialdata.xls").Close
    Application.DisplayAlerts = True
    Cancel = True
End If

End Sub

Sub データファイルオープン()

Dim wb As Workbook
For Each wb In Workbooks
    If wb.Name = "savedata.xls" Then
        Exit Sub
    End If
Next wb
Workbooks.Open ActiveWorkbook.Path & "\savedata.xls"

End Sub

Sub データファイルクローズ()

If CloseMode = 0 Then
    Application.DisplayAlerts = False
    Workbooks("savedata.xls").Close
    Application.DisplayAlerts = True
    Cancel = True
End If

End Sub
Sub データセーブ()

Call データファイルオープン

Dim i As Byte
Dim シート名 As Variant
Dim セル名 As Variant
Dim データファイルセル範囲 As Variant

Dim r As Long
Dim セル名2 As Variant
Dim データファイルセル範囲2 As Variant

For i = 1 To 100
    If Not Workbooks("savedata.xls").Sheets("Sheet1").Range("A" & i) = "" Then
        シート名 = Workbooks("savedata.xls").Sheets("Sheet1").Range("A" & i).Value
        セル名 = Workbooks("savedata.xls").Sheets("Sheet1").Range("B" & i).Value
        Workbooks("savedata.xls").Sheets("Sheet1").Range("C" & i).Value = Workbooks("CellBall.xls").Sheets(シート名).Range(セル名).Value
    End If
Next
For i = 3 To 100
    If Not Workbooks("savedata.xls").Sheets("Sheet1").Range("D" & i) = "" Then
        シート名 = Workbooks("savedata.xls").Sheets("Sheet1").Range("D" & i).Value
        セル名 = Workbooks("savedata.xls").Sheets("Sheet1").Range("E" & i).Value
        データファイルセル範囲 = Workbooks("savedata.xls").Sheets("Sheet1").Range("F" & i).Value
        Workbooks("savedata.xls").Sheets("Sheet2").Range(データファイルセル範囲).Value = Workbooks("CellBall.xls").Sheets(シート名).Range(セル名).Value
    End If
Next
For i = 1 To 10
    If Not Workbooks("savedata.xls").Sheets("Sheet1").Range("G" & i) = "" Then
        For r = 3 To 1000
            データファイルセル範囲2 = Workbooks("savedata.xls").Sheets("Sheet1").Range("H" & i).Value & r + 1211
            セル名2 = Workbooks("savedata.xls").Sheets("Sheet1").Range("G" & i).Value & r
            Workbooks("savedata.xls").Sheets("Sheet2").Range(データファイルセル範囲2).Value = "''" & Workbooks("CellBall.xls").Sheets("選手データ").Range(セル名2).Value
        Next
    End If
Next

Workbooks("savedata.xls").Sheets("Sheet3").Range("A1:AZ25000").Value = Workbooks("CellBall.xls").Sheets("試合結果").Range("A1:AZ25000").Value
Workbooks("savedata.xls").Sheets("Sheet4").Range("A1:AZ10000").Value = Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A1:AZ10000").Value

If Not Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A10001") = "" Then
    Workbooks("savedata.xls").Sheets("Sheet4").Range("A10001:AZ30000").Value = _
    Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A10001:AZ30000").Value
ElseIf Not Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A30001") = "" Then
    Workbooks("savedata.xls").Sheets("Sheet4").Range("A30001:AZ60000").Value = _
    Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A30001:AZ60000").Value
End If

Workbooks("savedata.xls").save

Call データファイルクローズ

End Sub

Sub データロード()

Call データファイルオープン

Dim i As Byte
Dim シート名 As Variant
Dim セル名 As Variant
Dim データファイルセル範囲 As Variant

For i = 1 To 100
    If Not Workbooks("savedata.xls").Sheets("Sheet1").Range("A" & i) = "" Then
        シート名 = Workbooks("savedata.xls").Sheets("Sheet1").Range("A" & i).Value
        セル名 = Workbooks("savedata.xls").Sheets("Sheet1").Range("B" & i).Value
        Workbooks("CellBall.xls").Sheets(シート名).Range(セル名).Value = Workbooks("savedata.xls").Sheets("Sheet1").Range("C" & i).Value
    End If
Next
For i = 3 To 100
    If Not Workbooks("savedata.xls").Sheets("Sheet1").Range("D" & i) = "" Then
        シート名 = Workbooks("savedata.xls").Sheets("Sheet1").Range("D" & i).Value
        セル名 = Workbooks("savedata.xls").Sheets("Sheet1").Range("E" & i).Value
        データファイルセル範囲 = Workbooks("savedata.xls").Sheets("Sheet1").Range("F" & i).Value
        Workbooks("CellBall.xls").Sheets(シート名).Range(セル名).Value = Workbooks("savedata.xls").Sheets("Sheet2").Range(データファイルセル範囲).Value
    End If
Next

Workbooks("CellBall.xls").Sheets("試合結果").Range("A1:AZ25000").Value = Workbooks("savedata.xls").Sheets("Sheet3").Range("A1:AZ25000").Value
Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A1:AZ10000").Value = Workbooks("savedata.xls").Sheets("Sheet4").Range("A1:AZ10000").Value

If Not Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A10001") = "" Then
    Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A10001:AZ30000").Value = _
    Workbooks("savedata.xls").Sheets("Sheet4").Range("A10001:AZ30000").Value
ElseIf Not Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A30001") = "" Then
    Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A30001:AZ60000").Value = _
    Workbooks("savedata.xls").Sheets("Sheet4").Range("A30001:AZ60000").Value
End If

Call データファイルクローズ


End Sub


Sub 初期データロード()

Call 初期データファイルオープン

Dim i As Byte
Dim シート名 As Variant
Dim セル名 As Variant
Dim データファイルセル範囲 As Variant

For i = 1 To 100
    If Not Workbooks("intialdata.xls").Sheets("Sheet1").Range("A" & i) = "" Then
        シート名 = Workbooks("intialdata.xls").Sheets("Sheet1").Range("A" & i).Value
        セル名 = Workbooks("intialdata.xls").Sheets("Sheet1").Range("B" & i).Value
        Workbooks("CellBall.xls").Sheets(シート名).Range(セル名).Value = Workbooks("intialdata.xls").Sheets("Sheet1").Range("C" & i).Value
    End If
Next
For i = 3 To 100
    If Not Workbooks("intialdata.xls").Sheets("Sheet1").Range("D" & i) = "" Then
        シート名 = Workbooks("intialdata.xls").Sheets("Sheet1").Range("D" & i).Value
        セル名 = Workbooks("intialdata.xls").Sheets("Sheet1").Range("E" & i).Value
        データファイルセル範囲 = Workbooks("intialdata.xls").Sheets("Sheet1").Range("F" & i).Value
        Workbooks("CellBall.xls").Sheets(シート名).Range(セル名).Value = Workbooks("intialdata.xls").Sheets("Sheet2").Range(データファイルセル範囲).Value
    End If
Next

Workbooks("CellBall.xls").Sheets("試合結果").Range("A1:AZ25000").Value = Workbooks("intialdata.xls").Sheets("Sheet3").Range("A1:AZ25000").Value
Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A1:AZ10000").Value = Workbooks("intialdata.xls").Sheets("Sheet4").Range("A1:AZ10000").Value

If Not Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A10001") = "" Then
    Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A10001:AZ30000").Value = _
    Workbooks("intialdata.xls").Sheets("Sheet4").Range("A10001:AZ30000").Value
ElseIf Not Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A30001") = "" Then
    Workbooks("CellBall.xls").Sheets("引退選手成績保管").Range("A30001:AZ60000").Value = _
    Workbooks("intialdata.xls").Sheets("Sheet4").Range("A30001:AZ60000").Value
End If

Call 初期データファイルクローズ


End Sub

Sub 試合成績記録()

Dim i As Long
Dim 列番号 As Integer


For i = 102 To 239

    If Range("Sheet1!A" & i).Value = "" Then
    Else
    列番号 = Range("Sheet1!A" & i).Value
    Range("選手データ!BC" & 列番号 & ":BT" & 列番号).Value = Range("Sheet1!C" & i & ":T" & i).Value
    End If
Next

End Sub




